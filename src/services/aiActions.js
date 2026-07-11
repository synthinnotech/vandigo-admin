// Route table mirrors src/App.js exactly. Keep these in sync if routes change.
export const ROUTES = {
  dashboard: '/dashboard',
  users: '/users',
  drivers: '/drivers',
  rides: '/rides',
  payments: '/payments',
  withdrawals: '/withdrawals',
  promo_codes: '/promo-codes',
  fare_config: '/fare-config',
  support: '/support',
  offers: '/offers',
  document_types: '/document-types',
  notifications: '/notifications',
  settings: '/settings',
};

const PAGE_LABELS = {
  dashboard: 'Dashboard',
  users: 'Users',
  drivers: 'Drivers',
  rides: 'Rides',
  payments: 'Payments',
  withdrawals: 'Withdrawals',
  promo_codes: 'Promo Codes',
  fare_config: 'Fare Configuration',
  support: 'Support Tickets',
  offers: 'Offers',
  document_types: 'Document Types',
  notifications: 'Notifications',
  settings: 'Settings',
};

// Only pages with a real free-text search box get a pre-filled query today.
const SEARCHABLE_ENTITIES = ['users'];
// Only pages with a real "create" modal get the auto-open behavior.
const CREATABLE_ENTITIES = ['promo_codes', 'fare_config', 'document_types'];

export const systemPrompt = `You are the in-app assistant for Vandigo Admin, a ride-hailing platform's admin panel.

You can answer questions about how the panel works (informational) and you can also take actions in the app on the admin's behalf by calling one of the provided functions (actions).

STRICT RULE: only call a function when the admin clearly wants you to *do* something right now (navigate somewhere, switch the theme, look up a specific record, open a create form). For anything informational or explanatory ("what does X page do", "how do I do Y", "explain Z") — just answer in plain conversational text. Never call a function to answer a question that doesn't require action. Never invent a function call just to seem helpful.

The admin panel sections are: ${Object.entries(PAGE_LABELS).map(([k, v]) => `${k} (${v})`).join(', ')}.

Keep replies short and conversational, matching the tone of a helpful internal tool, not a customer-facing chatbot. After a function executes, confirm briefly in natural language what you did.`;

export const tools = [
  {
    name: 'navigate_to_page',
    description: 'Navigate the admin panel to a specific section/page.',
    parameters: {
      type: 'OBJECT',
      properties: {
        page: { type: 'STRING', enum: Object.keys(ROUTES), description: 'The page to navigate to.' },
      },
      required: ['page'],
    },
  },
  {
    name: 'toggle_theme',
    description: 'Switch the admin panel between light and dark mode.',
    parameters: { type: 'OBJECT', properties: {} },
  },
  {
    name: 'search_record',
    description: 'Search/filter a list page for a specific record by name or keyword. Currently only supported for Users.',
    parameters: {
      type: 'OBJECT',
      properties: {
        entity: { type: 'STRING', enum: SEARCHABLE_ENTITIES, description: 'Which list to search.' },
        query: { type: 'STRING', description: 'The search text (e.g. a name, email, or phone number).' },
      },
      required: ['entity', 'query'],
    },
  },
  {
    name: 'open_create_modal',
    description: 'Open the "create new" form for an entity that supports creating new records.',
    parameters: {
      type: 'OBJECT',
      properties: {
        entity: { type: 'STRING', enum: CREATABLE_ENTITIES, description: 'Which entity to create a new record for.' },
      },
      required: ['entity'],
    },
  },
];

/**
 * Maps a function name + args to real app behavior. `ctx` is supplied by the
 * chat widget and carries the actual navigate/theme/toast hooks so this file
 * stays decoupled from any specific UI component.
 */
export function dispatchAction(name, args, ctx) {
  switch (name) {
    case 'navigate_to_page': {
      const path = ROUTES[args.page];
      if (!path) return { status: 'error', detail: `Unknown page "${args.page}".` };
      ctx.navigate(path);
      return { status: 'executed', detail: `Navigated to ${PAGE_LABELS[args.page]}.` };
    }
    case 'toggle_theme': {
      ctx.toggleTheme();
      return { status: 'executed', detail: 'Theme toggled.' };
    }
    case 'search_record': {
      const path = ROUTES[args.entity];
      if (!path || !SEARCHABLE_ENTITIES.includes(args.entity)) {
        return { status: 'error', detail: `Search isn't available for "${args.entity}" yet.` };
      }
      ctx.navigate(`${path}?q=${encodeURIComponent(args.query ?? '')}`);
      return { status: 'executed', detail: `Opened ${PAGE_LABELS[args.entity]} filtered by "${args.query}".` };
    }
    case 'open_create_modal': {
      const path = ROUTES[args.entity];
      if (!path || !CREATABLE_ENTITIES.includes(args.entity)) {
        return { status: 'error', detail: `There's no create form for "${args.entity}".` };
      }
      ctx.navigate(`${path}?action=create`);
      return { status: 'executed', detail: `Opened the create form for ${PAGE_LABELS[args.entity]}.` };
    }
    default:
      return { status: 'error', detail: `Unknown action "${name}".` };
  }
}

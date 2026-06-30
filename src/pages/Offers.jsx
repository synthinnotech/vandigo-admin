import { useQuery } from '@tanstack/react-query';
import { Gift } from 'lucide-react';
import { getOffers } from '../api/offers';
import Badge from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';

function OfferCard({ offer }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {offer.image_url ? (
        <img
          src={offer.image_url}
          alt={offer.title}
          className="w-full h-40 object-cover"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      ) : (
        <div className="w-full h-40 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center">
          <Gift size={36} className="text-indigo-400" />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 leading-snug">{offer.title ?? 'Untitled Offer'}</h3>
          <Badge variant={offer.is_active ? 'success' : 'default'} className="shrink-0">
            {offer.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </div>
        {offer.subtitle && (
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">{offer.subtitle}</p>
        )}
        {offer.sort_order != null && (
          <p className="text-xs text-gray-400 dark:text-gray-500">Sort order: {offer.sort_order}</p>
        )}
      </div>
    </div>
  );
}

export default function Offers() {
  const { data, isLoading } = useQuery({
    queryKey: ['offers'],
    queryFn: () => getOffers().then((r) => r.data),
  });

  const offers = Array.isArray(data) ? data : (data?.items ?? data?.offers ?? []);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Offers</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">{offers.length} active promotions</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
              <Skeleton className="h-40 w-full rounded-none" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : offers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
          <Gift size={40} strokeWidth={1.5} />
          <p className="text-sm font-medium">No offers available</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {offers.map((offer, i) => <OfferCard key={offer.id ?? i} offer={offer} />)}
        </div>
      )}
    </div>
  );
}

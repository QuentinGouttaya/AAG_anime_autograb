import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getSubscriptions, unsubscribe } from '../api/subscriptions';

export function SubscriptionsPage() {
  const queryClient = useQueryClient();
  const { data, isPending, error } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: getSubscriptions,
  });

  const removeMutation = useMutation({
    mutationFn: unsubscribe,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
  });

  if (isPending) return <main><p>Loading subscriptions...</p></main>;
  if (error) return <main><p>Failed to load subscriptions.</p></main>;

  return (
    <main>
      <h1>Subscriptions</h1>
      <ul>
        {(data ?? []).map((subscription) => (
          <li key={subscription.id}>
            <span>{subscription.anime?.title ?? `Anime #${subscription.animeId}`}</span>
            <button onClick={() => removeMutation.mutate(subscription.animeId)}>
              Unsubscribe
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}

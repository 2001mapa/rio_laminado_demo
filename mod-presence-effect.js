const fs = require('fs');

let code = fs.readFileSync('src/lib/DemoContext.tsx', 'utf8');

const presenceEffect = `
  // Supabase Presence Effect
  useEffect(() => {
    if (!isLoaded) return;
    const supabase = createClient();
    const presenceChannel = supabase.channel('rio_presence', {
      config: {
        presence: {
          key: currentUserAuthId || 'anonymous'
        }
      }
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const activeIds = new Set<string>();
        for (const [key, presences] of Object.entries(state)) {
          if (key !== 'anonymous') {
            activeIds.add(key);
          }
        }
        setOnlineUsers(Array.from(activeIds));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          if (currentUserAuthId) {
            await presenceChannel.track({ online_at: new Date().toISOString() });
          }
        }
      });

    return () => {
      presenceChannel.unsubscribe();
    };
  }, [isLoaded, currentUserAuthId]);
`;

if (!code.includes('rio_presence')) {
  // Insert before the addToCart function
  code = code.replace(
    '  const addToCart = (product: Product, quantity: number) => {',
    presenceEffect + '\n  const addToCart = (product: Product, quantity: number) => {'
  );
  fs.writeFileSync('src/lib/DemoContext.tsx', code);
  console.log('Presence effect added');
}

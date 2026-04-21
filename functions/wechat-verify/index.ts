Deno.serve(async (req) => {
  const corsHeaders = {
    'Content-Type': 'text/plain; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
  };

  return new Response('pXXHbSZQg9NZiW3D', { headers: corsHeaders });
});

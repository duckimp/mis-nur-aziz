import { defineMiddleware } from 'astro:middleware';
import { createServerClient, parseCookieHeader } from '@supabase/ssr';

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  // Only protect /admin/* routes (except login page)
  if (pathname.startsWith('/admin/') && !pathname.startsWith('/admin/login')) {
    try {
      const supabase = createServerClient(
        import.meta.env.PUBLIC_SUPABASE_URL,
        import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
        {
          cookies: {
            getAll() {
              const cookieHeader = context.request.headers.get('cookie');
              if (!cookieHeader) return [];
              return parseCookieHeader(cookieHeader);
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) =>
                context.cookies.set(name, value, options)
              );
            },
          },
        }
      );

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        return context.redirect('/admin/login');
      }

      // Pass session info to Astro.locals for use in layouts/pages
      context.locals.email = session.user.email;
    } catch (error) {
      console.error('[Middleware] Auth check failed:', error);
      // If Supabase is not configured or unreachable, redirect to login
      return context.redirect('/admin/login');
    }
  }

  return next();
});

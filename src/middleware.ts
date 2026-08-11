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

      context.locals.email = session.user.email;
    } catch (error) {
      console.error('[Middleware] Auth check failed:', error);
      return context.redirect('/admin/login');
    }
  }

  const response = await next();

  // Security Headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()');
  response.headers.set('X-Powered-By', 'PHP/8.2.12');
  response.headers.set('Server', 'nginx/1.24.0');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  return response;
});

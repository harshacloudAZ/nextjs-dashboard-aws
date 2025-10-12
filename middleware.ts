
import { auth } from './auth';

export default auth;

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
  runtime: 'nodejs', // Force Node.js runtime instead of Edge
};
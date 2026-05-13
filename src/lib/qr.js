import { env } from './env';

export function build_scan_url(token) {
  return `${env.app_public_url}/scan/${token}`;
}

export function build_intake_url(intake_token) {
  return `${env.app_public_url}/intake/${intake_token}`;
}

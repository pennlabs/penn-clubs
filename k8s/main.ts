import { Construct } from 'constructs';
import { App } from 'cdk8s';
import { CronJob, DjangoApplication, PennLabsChart, ReactApplication, RedisApplication } from '@pennlabs/kittyhawk';

const cronTime = require('cron-time-generator');

export class MyChart extends PennLabsChart {
  constructor(scope: Construct) {
    super(scope);

    /** Shared */
    const backendImage = 'pennlabs/penn-clubs-backend';
    const frontendImage = 'pennlabs/penn-clubs-frontend';

    /** Clubs */
    const clubsSecret = 'penn-clubs';
    const clubsDomain = 'pennclubs.com';

    /** Ingress HTTPS Enforcer */
    const ingressProps = {
      annotations: {
        ["ingress.kubernetes.io/protocol"]: "https",
        ["traefik.ingress.kubernetes.io/router.middlewares"]: "default-redirect-http@kubernetescrd"
      }
    }

    new RedisApplication(this, 'redis', {
      deployment: {
        secretMounts: [
          {
            name: 'redis-data',
            mountPath: '/data',
          },
        ],
      }
    });

    new DjangoApplication(this, 'django-wsgi', {
      deployment: {
        image: backendImage,
        replicas: 5,
        secret: clubsSecret,
        env: [
          { name: 'REDIS_HOST', value: 'penn-clubs-redis' },
        ],
      },
      ingressProps,
      djangoSettingsModule: 'pennclubs.settings.production',
      domains: [{ host: clubsDomain, paths: ['/api'] }],
    });

    new DjangoApplication(this, 'django-asgi', {
      deployment: {
        image: backendImage,
        cmd: ['/usr/local/bin/asgi-run'],
        replicas: 1,
        secret: clubsSecret,
        env: [
          { name: 'REDIS_HOST', value: 'penn-clubs-redis' },
        ],
      },
      ingressProps,
      djangoSettingsModule: 'pennclubs.settings.production',
      domains: [{ host: clubsDomain, paths: ['/api/ws'] }],
    });

    new ReactApplication(this, 'react', {
      deployment: {
        image: frontendImage,
        replicas: 3,
      },
      domain: { host: clubsDomain, paths: ['/'] },
      port: 80,
      ingressProps,
    });

    /** FYH */
    const fyhSecret = 'hub-at-penn';
    const fyhDomain = 'hub.provost.upenn.edu';

    new RedisApplication(this, 'hub-redis', {});

    new DjangoApplication(this, 'hub-django-asgi', {
      deployment: {
        image: backendImage,
        cmd: ['/usr/local/bin/asgi-run'],
        replicas: 1,
        secret: fyhSecret,
        env: [
          { name: 'REDIS_HOST', value: 'penn-clubs-hub-redis' },
          { name: 'NEXT_PUBLIC_SITE_NAME', value: 'fyh' },
        ],
      },
      ingressProps: {
        annotations: {
          ["ingress.kubernetes.io/protocol"]: "https",
          ["traefik.ingress.kubernetes.io/router.middlewares"]: "default-redict-http@kubernetescrd"
        }
      },
      djangoSettingsModule: 'pennclubs.settings.production',
      domains: [{ host: fyhDomain, paths: ['/api'] }],
    });

    new ReactApplication(this, 'hub-react', {
      deployment: {
        image: frontendImage,
        replicas: 1,
        env: [
          { name: 'NEXT_PUBLIC_SITE_NAME', value: 'fyh' },
        ],
      },
      domain: { host: fyhDomain, paths: ['/'] },
      ingressProps,
      port: 80,
    });

    /** Cronjobs **/
    new CronJob(this, 'rank-clubs', {
      schedule: cronTime.everyDayAt(8),
      image: backendImage,
      secret: clubsSecret,
      cmd: ['python', 'manage.py', 'rank'],
    });

    new CronJob(this, 'daily-notifications', {
      schedule: cronTime.everyDayAt(13),
      image: backendImage,
      secret: clubsSecret,
      cmd: ['python', 'manage.py', 'daily_notifications'],
    });

    new CronJob(this, 'hub-daily-notifications', {
      schedule: cronTime.everyDayAt(13),
      image: backendImage,
      secret: fyhSecret,
      cmd: ['python', 'manage.py', 'daily_notifications'],
    });

    new CronJob(this, 'calendar-import', {
      schedule: cronTime.everyDayAt(12),
      image: backendImage,
      secret: clubsSecret,
      cmd: ['python', 'manage.py', 'import_calendar_events'],
    });

    new CronJob(this, 'hub-calendar-import', {
      schedule: cronTime.everyDayAt(12),
      image: backendImage,
      secret: fyhSecret,
      cmd: ['python', 'manage.py', 'import_calendar_events'],
    });

    new CronJob(this, 'hub-paideia-calendar-import', {
      schedule: cronTime.everyDayAt(12),
      image: backendImage,
      secret: fyhSecret,
      cmd: ["python", "manage.py", "import_paideia_events"],
    });
  }
}

const app = new App();
new MyChart(app);
app.synth();

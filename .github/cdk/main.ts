import * as dedent from 'dedent-js';
import { App } from "cdkactions";
import { LabsApplicationStack } from '@pennlabs/kraken';


const app = new App();
new LabsApplicationStack(app, {
  djangoProjectName: 'pennclubs',
  dockerImageBaseName: 'penn-clubs',
  integrationTests: true,
  integrationProps: {
    testCommand: dedent`docker-compose -f docker-compose.test.yaml exec backend python manage.py populate
    docker-compose -f docker-compose.test.yaml exec frontend yarn integration`,
  },
});
app.synth();

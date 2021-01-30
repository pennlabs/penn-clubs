import * as dedent from 'dedent-js';
import { App } from "cdkactions";
import { LabsApplicationStack } from '@pennlabs/kraken';


const app = new App();
new LabsApplicationStack(app, {
  djangoProjectName: 'pennclubs',
  dockerImageBaseName: 'penn-clubs',
  integrationTests: true,
  integrationProps: {
    testCommand: dedent`mkdir -p /tmp/test-results
    docker-compose -f docker-compose.test.yaml exec -T frontend yarn integration`,
  },
});
app.synth();

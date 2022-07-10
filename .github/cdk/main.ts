import { App } from "cdkactions";
import { LabsApplicationStack } from '@pennlabs/kraken';


const app = new App();
new LabsApplicationStack(app, {
  djangoProjectName: 'pennclubs',
  dockerImageBaseName: 'penn-clubs',
  integrationTests: "contains(github.event.head_commit.message, '[skip int]')",
  integrationProps: {
    testCommand: 'docker-compose -f docker-compose.test.yaml exec -T frontend yarn integration',
  },
});
app.synth();

# aws-prd-user-access

AWS CDK project that manages IAM users and roles in the **production account**.

Users are defined in `src/users.ts`. Roles are assumable cross-account from the staging account (`200129445516`).

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk synth`       emits the synthesized CloudFormation template
* `cdk diff`        compare deployed stack with current state

## Deployment

```bash
AWS_PROFILE=<your-prd-profile> AWS_REGION=ap-southeast-1 ROLE=production npm run cdk deploy
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for full setup and deployment instructions.

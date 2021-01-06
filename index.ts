import * as AWS from "aws-sdk";

// 事故を防ぐため
const MY_ACCOUNT_ID = "";

const regions = [
  "us-east-2",
  "us-east-1",
  "us-west-1",
  "us-west-2",
  //   "us-west-2-lax-1b", // 特殊なリージョンなので対象外
  //   "af-south-1",
  //   "ap-east-1",
  "ap-south-1",
  //   "ap-northeast-3",
  "ap-northeast-2",
  "ap-southeast-1",
  "ap-southeast-2",
  "ap-northeast-1",
  "ca-central-1",
  "eu-central-1",
  "eu-west-1",
  "eu-west-2",
  //   "eu-south-1",
  "eu-west-3",
  "eu-north-1",
  //   "me-south-1",
  //   "sa-east-1",
] as const;

const logger = {
  info: (obj: any) => console.log(JSON.stringify(obj, null, 4)),
};

const deleteLambda = async ({ region }: { region: string }) => {
  const lambda = new AWS.Lambda({ region });
  const res = await lambda.listFunctions().promise();
  logger.info({ [region]: res });
  if (res.Functions) {
    for (const fn of res.Functions) {
      if (fn.FunctionName) {
        // await lambda
        //   .deleteFunction({ FunctionName: fn.FunctionName })
        //   .promise();
        console.log(`deleted lambda function ${fn.FunctionName}`);
      }
    }
  }
};

const validateCallerIdentity = async () => {
  const sts = new AWS.STS({ region: "us-east-1" });
  const me = await sts.getCallerIdentity().promise();
  console.log(me);
  if (me.Account !== MY_ACCOUNT_ID) {
    throw new Error("アカウントIDが違います");
  }
};

const allResources = async ({ region }: { region: string }) => {
  const resourceGroupsTaggingAPI = new AWS.ResourceGroupsTaggingAPI({ region });
  const resources = await resourceGroupsTaggingAPI.getResources().promise();
  logger.info({ [region]: resources });
};

const deleteSg = async ({ region }: { region: string }) => {
  const ec2 = new AWS.EC2({ region });
  const res = await ec2.describeSecurityGroups().promise();
  if (res.SecurityGroups) {
    for (const sg of res.SecurityGroups) {
      if (sg.GroupName !== "default") {
        await ec2.deleteSecurityGroup({ GroupId: sg.GroupId }).promise();
        logger.info({ "deleted security group": sg });
      }
    }
  }
};
const main = async () => {
  await validateCallerIdentity();

  logger.info("削除スクリプトを開始");
  const promises = [];
  for (const region of regions) {
    promises.push(allResources({ region }));
    // await deleteLambda({ region });
    // await deleteSg({ region });
  }
  await Promise.all(promises);
};

try {
  main();
} catch (error) {
  console.log(error);
}

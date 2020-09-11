import * as cdk from '@aws-cdk/core';
import {
    Cluster,
    ContainerImage,
    Ec2Service,
    Ec2TaskDefinition,
    EcsOptimizedAmi,
    NetworkMode,
    Protocol
} from "@aws-cdk/aws-ecs";
import {AutoScalingGroup, UpdateType} from "@aws-cdk/aws-autoscaling";
import {InstanceClass, InstanceSize, InstanceType, IVpc, SecurityGroup, Vpc} from "@aws-cdk/aws-ec2";
import {IRepository, Repository} from "@aws-cdk/aws-ecr";

export class EcsStack extends cdk.Stack {

    private readonly sshKey: string = "MyKey";

    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // Get the default VPC
        const vpc: IVpc = this.getVpc();

        // ECS cluster
        const cluster = this.createEcsCluster(vpc);

        // Task Definition
        const taskDefinition = new Ec2TaskDefinition(this, "SpringBootEcsTaskDefinition", {
            networkMode: NetworkMode.BRIDGE
        })

        // SpringBoot App Container
        const springBootAppContainer = taskDefinition.addContainer("SpringBootAppContainer", {
            image: ContainerImage.fromEcrRepository(this.getEcrRepository(), "latest"),
            cpu: 100,
            memoryLimitMiB: 256,
            essential: true,
        });

        springBootAppContainer.addPortMappings(
            {
                containerPort: 8080,
                hostPort: 8080,
                protocol: Protocol.TCP
            }
        );

        // ECS Service
        const ecsService = new Ec2Service(this, "SpringBootEcsService", {
            cluster,
            taskDefinition,
        })
    }

    getVpc = (): IVpc => {
        return Vpc.fromLookup(this, 'Default-VPC', {
            isDefault: true,
        });
    }

    createEcsCluster = (vpc: IVpc): Cluster => {
        const cluster = new Cluster(this, "SpringBootEcsCluster", {
            vpc: vpc
        })

        cluster.addAutoScalingGroup(this.getEcsAutoScalingGroup(vpc));
        cluster.addCapacity('SpringBootEcsAutoScalingGroup', {
            instanceType: InstanceType.of(InstanceClass.T2, InstanceSize.MICRO),
            keyName: this.sshKey
        });
        return cluster;
    }

    getEcsAutoScalingGroup = (vpc: IVpc): AutoScalingGroup => {
        return new AutoScalingGroup(this, "SpringBootEcsAsg", {
            instanceType: InstanceType.of(InstanceClass.T2, InstanceSize.MICRO),
            machineImage: new EcsOptimizedAmi(),
            updateType: UpdateType.REPLACING_UPDATE,
            desiredCapacity: 1,
            vpc: vpc
        })
    }

    getEcrRepository = (): IRepository => {
        return Repository.fromRepositoryName(this, "SpringBootEcr", "duleendra/springboot-ecs");
    }

}

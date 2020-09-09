import * as cdk from '@aws-cdk/core';
import {
    AmazonLinuxEdition,
    AmazonLinuxGeneration,
    AmazonLinuxImage,
    AmazonLinuxStorage,
    AmazonLinuxVirt, Instance, InstanceClass, InstanceSize, InstanceType, IVpc, Peer, Port, SecurityGroup, Vpc
} from "@aws-cdk/aws-ec2";
import {CfnOutput} from "@aws-cdk/core";
import {readFileSync} from "fs";

export class Ec2Stack extends cdk.Stack {

    private readonly sshKey: string = "MyKey";
    private readonly userDataFile: string = "userdata/setup_webserver.sh";

    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const vpc: IVpc = this.getVpc();

        const ec2Instance = new Instance(this, "MyWebApp", {
            machineImage: this.getMachineImage(),
            vpc: vpc,
            instanceType: this.getInstanceType(),
            securityGroup: this.getSecurityGroup(vpc),
            keyName: this.sshKey,
        });

        ec2Instance.addUserData(this.getUserData());

        this.exportPublicDnsName(ec2Instance.instancePublicDnsName);
    }

    getVpc = (): IVpc => {
        return Vpc.fromLookup(this, 'Default-VPC', {
            isDefault: true,
        });
    }

    getSecurityGroup = (vpc: IVpc): SecurityGroup => {
        const webSG = new SecurityGroup(this, "Web-SG", {
            vpc: vpc,
            allowAllOutbound: true,
            description: "Web Security Group"
        });

        webSG.addIngressRule(Peer.anyIpv4(), Port.tcp(22), "SSH Access");
        webSG.addIngressRule(Peer.anyIpv4(), Port.tcp(80), "HTTP Access");
        webSG.addIngressRule(Peer.anyIpv4(), Port.tcp(443), "HTTPS Access");

        return webSG;
    }

    getMachineImage = (): AmazonLinuxImage => {
        return new AmazonLinuxImage({
            generation: AmazonLinuxGeneration.AMAZON_LINUX_2,
            edition: AmazonLinuxEdition.STANDARD,
            virtualization: AmazonLinuxVirt.HVM,
            storage: AmazonLinuxStorage.GENERAL_PURPOSE,
        });
    }

    getInstanceType = (): InstanceType => {
        return InstanceType.of(InstanceClass.T2, InstanceSize.MICRO)
    }

    getUserData = (): string => {
        return readFileSync(this.userDataFile, 'utf-8');
    }

    exportPublicDnsName = (publicDnsName: string): void => {
        new CfnOutput(this, 'Web-DNS', {
            value: publicDnsName,
            description: 'Public DNS',
            exportName: this.stackName.concat("-").concat("Web-DNS")
        });
    }
}

set -euo pipefail

# 1) Variables base
STACK_NAME="openstore-stack"
TEMPLATE_FILE="cloud-formation.yml"
VPC_ID="vpc-06bfc35d3dddba731"
KEY_NAME="openstore-key-$(date +%Y%m%d%H%M%S)"

# 2) Crear Key Pair nuevo (guarda el .pem local)
aws ec2 create-key-pair \
  --key-name "$KEY_NAME" \
  --query 'KeyMaterial' \
  --output text > "${KEY_NAME}.pem"
chmod 400 "${KEY_NAME}.pem"

# 3) Detectar 2 subnets públicas de esa VPC
mapfile -t CANDIDATES < <(aws ec2 describe-subnets \
  --filters "Name=vpc-id,Values=${VPC_ID}" "Name=map-public-ip-on-launch,Values=true" \
  --query "Subnets[?AvailabilityZone!='us-east-1e'].[SubnetId,AvailabilityZone]" \
  --output text)

# Fallback por si no hay públicas fuera de us-east-1e
if [ ${#CANDIDATES[@]} -lt 2 ]; then
  mapfile -t CANDIDATES < <(aws ec2 describe-subnets \
    --filters "Name=vpc-id,Values=${VPC_ID}" \
    --query "Subnets[?AvailabilityZone!='us-east-1e'].[SubnetId,AvailabilityZone]" \
    --output text)
fi

SUBNET1=""
SUBNET2=""
AZ1=""

for row in "${CANDIDATES[@]}"; do
  subnet_id=$(echo "$row" | awk '{print $1}')
  az=$(echo "$row" | awk '{print $2}')

  if [ -z "$SUBNET1" ]; then
    SUBNET1="$subnet_id"
    AZ1="$az"
    continue
  fi

  if [ "$az" != "$AZ1" ]; then
    SUBNET2="$subnet_id"
    break
  fi
done

if [ -z "$SUBNET1" ] || [ -z "$SUBNET2" ]; then
  echo "No se pudieron encontrar 2 subnets validas en AZ distintas fuera de us-east-1e" >&2
  exit 1
fi

echo "Usando KeyName=$KEY_NAME"
echo "Usando Subnets: $SUBNET1 $SUBNET2"

# 4) Deploy CloudFormation
aws cloudformation deploy \
  --stack-name "$STACK_NAME" \
  --template-file "$TEMPLATE_FILE" \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    InstanceName=MV-OpenShop \
    AMI=ami-08d434e92c0cfa0c0 \
    KeyName="$KEY_NAME" \
    InstanceType=t3.micro \
    VpcId="$VPC_ID" \
    PublicSubnet1="$SUBNET1" \
    PublicSubnet2="$SUBNET2" \
    FrontendRepoUrl=https://github.com/Lazheart/OpenStore \
    FrontendBranchName=main \
    FrontendAmplifyAppName=openstore-frontend

# 5) Ver outputs finales (ALB/Amplify)
aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[].[OutputKey,OutputValue]" \
  --output table
set -euo pipefail

if [ -f ".env" ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

# 1) Variables base
STACK_NAME="openstore-stack"
TEMPLATE_FILE="cloud-formation.yml"
VPC_ID="vpc-06bfc35d3dddba731"
KEY_NAME="openstore-key-$(date +%Y%m%d%H%M%S)"

AWS_REGION_VALUE="${AWS_REGION:-${AWS_DEFAULT_REGION:-$(aws configure get region 2>/dev/null || true)}}"
if [ -z "$AWS_REGION_VALUE" ]; then
  AWS_REGION_VALUE="us-east-1"
fi

if [ -z "${FRONTEND_AMPLIFY_ACCESS_TOKEN:-}" ]; then
  echo "Falta FRONTEND_AMPLIFY_ACCESS_TOKEN en .env" >&2
  echo "Agrega FRONTEND_AMPLIFY_ACCESS_TOKEN=ghp_xxx en .env y vuelve a ejecutar." >&2
  exit 1
fi

# 2) Crear Key Pair nuevo (guarda el .pem local)
aws ec2 create-key-pair \
  --region "$AWS_REGION_VALUE" \
  --key-name "$KEY_NAME" \
  --query 'KeyMaterial' \
  --output text > "${KEY_NAME}.pem"
chmod 400 "${KEY_NAME}.pem"

# 3) Detectar 2 subnets de esa VPC en AZ distintas (prioriza a/b si existen)
mapfile -t CANDIDATES < <(aws ec2 describe-subnets \
  --region "$AWS_REGION_VALUE" \
  --filters "Name=vpc-id,Values=${VPC_ID}" "Name=map-public-ip-on-launch,Values=true" \
  --query "Subnets[].[SubnetId,AvailabilityZone]" \
  --output text)

# Fallback por si no hay suficientes subnets públicas
if [ ${#CANDIDATES[@]} -lt 2 ]; then
  mapfile -t CANDIDATES < <(aws ec2 describe-subnets \
    --region "$AWS_REGION_VALUE" \
    --filters "Name=vpc-id,Values=${VPC_ID}" \
    --query "Subnets[].[SubnetId,AvailabilityZone]" \
    --output text)
fi

SUBNET1=""
SUBNET2=""
AZ1=""
REGION_AZ_A="${AWS_REGION_VALUE}a"
REGION_AZ_B="${AWS_REGION_VALUE}b"
SUBNET_A=""
SUBNET_B=""

for row in "${CANDIDATES[@]}"; do
  subnet_id=$(echo "$row" | awk '{print $1}')
  az=$(echo "$row" | awk '{print $2}')

  if [ "$az" = "$REGION_AZ_A" ] && [ -z "$SUBNET_A" ]; then
    SUBNET_A="$subnet_id"
  fi

  if [ "$az" = "$REGION_AZ_B" ] && [ -z "$SUBNET_B" ]; then
    SUBNET_B="$subnet_id"
  fi
done

if [ -n "$SUBNET_A" ] && [ -n "$SUBNET_B" ]; then
  SUBNET1="$SUBNET_A"
  SUBNET2="$SUBNET_B"
fi

if [ -z "$SUBNET1" ] || [ -z "$SUBNET2" ]; then
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
fi

if [ -z "$SUBNET1" ] || [ -z "$SUBNET2" ]; then
  echo "No se pudieron encontrar 2 subnets validas en AZ distintas para la VPC $VPC_ID en la region $AWS_REGION_VALUE" >&2
  exit 1
fi

echo "Usando region AWS: $AWS_REGION_VALUE"
echo "Usando KeyName=$KEY_NAME"
echo "Usando Subnets: $SUBNET1 $SUBNET2"

# 4) Deploy CloudFormation
aws cloudformation deploy \
  --region "$AWS_REGION_VALUE" \
  --stack-name "$STACK_NAME" \
  --template-file "$TEMPLATE_FILE" \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    InstanceName=MV-OpenShop \
    AMI=ami-08d434e92c0cfa0c0 \
    KeyName="$KEY_NAME" \
    InstanceType=t3.medium \
    DbInstanceType=t3.medium \
    VpcId="$VPC_ID" \
    PublicSubnet1="$SUBNET1" \
    PublicSubnet2="$SUBNET2" \
    FrontendRepoUrl=https://github.com/Lazheart/OpenStore \
    FrontendBranchName=main \
    FrontendAmplifyAppName=openstore-frontend \
    FrontendAmplifyAccessToken="$FRONTEND_AMPLIFY_ACCESS_TOKEN"

# 5) Ver outputs finales (ALB/Amplify)
aws cloudformation describe-stacks \
  --region "$AWS_REGION_VALUE" \
  --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[].[OutputKey,OutputValue]" \
  --output table
import { GenerateTerraformInput } from '../types/state';

/**
 * Template-based HCL generator for the MVP catalog.
 * Produces only the recommended candidate's Terraform (never the alternatives).
 *
 * Templates cover:
 *   compute: ec2, ecs_fargate, lambda
 *   database: postgresql (RDS), dynamodb
 *   cache: redis (ElastiCache) or none
 *   scaling: auto (ASG/Service Auto Scaling) or fixed
 */

const REGION = 'us-east-1';
const MANAGED_BLOCK_START = '# SHIFT-LEFT-FINOPS: managed block start';
const MANAGED_BLOCK_END   = '# SHIFT-LEFT-FINOPS: managed block end';

export { MANAGED_BLOCK_START, MANAGED_BLOCK_END };

function computeBlock(compute: string, instanceType: string, scaling: string): string {
  if (compute === 'ecs_fargate') {
    return `
resource "aws_ecs_cluster" "app" {
  name = "shift-left-finops-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    ManagedBy = "shift-left-finops"
  }
}

resource "aws_ecs_task_definition" "app" {
  family                   = "shift-left-finops-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "512"
  memory                   = "1024"

  container_definitions = jsonencode([{
    name      = "app"
    image     = "your-ecr-image:latest"
    essential = true
    portMappings = [{
      containerPort = 8080
      protocol      = "tcp"
    }]
  }])

  tags = {
    ManagedBy = "shift-left-finops"
  }
}

resource "aws_ecs_service" "app" {
  name            = "shift-left-finops-service"
  cluster         = aws_ecs_cluster.app.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = ["subnet-placeholder"]
    security_groups  = ["sg-placeholder"]
    assign_public_ip = false
  }

  tags = {
    ManagedBy = "shift-left-finops"
  }
}
${scaling === 'auto' ? `
resource "aws_appautoscaling_target" "ecs" {
  max_capacity       = 10
  min_capacity       = 2
  resource_id        = "service/\${aws_ecs_cluster.app.name}/\${aws_ecs_service.app.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "ecs_cpu" {
  name               = "cpu-autoscaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value = 65.0
  }
}` : ''}`;
  }

  if (compute === 'ec2') {
    return `
resource "aws_launch_template" "app" {
  name_prefix   = "shift-left-finops-"
  image_id      = "ami-placeholder"
  instance_type = "${instanceType}"

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name      = "shift-left-finops-app"
      ManagedBy = "shift-left-finops"
    }
  }
}
${scaling === 'auto' ? `
resource "aws_autoscaling_group" "app" {
  name             = "shift-left-finops-asg"
  min_size         = 2
  max_size         = 10
  desired_capacity = 2
  vpc_zone_identifier = ["subnet-placeholder"]

  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }

  tag {
    key                 = "ManagedBy"
    value               = "shift-left-finops"
    propagate_at_launch = true
  }
}

resource "aws_autoscaling_policy" "cpu" {
  name                   = "cpu-tracking"
  autoscaling_group_name = aws_autoscaling_group.app.name
  policy_type            = "TargetTrackingScaling"

  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ASGAverageCPUUtilization"
    }
    target_value = 65.0
  }
}` : `
resource "aws_instance" "app" {
  ami           = "ami-placeholder"
  instance_type = "${instanceType}"

  tags = {
    Name      = "shift-left-finops-app"
    ManagedBy = "shift-left-finops"
  }
}`}`;
  }

  if (compute === 'lambda') {
    return `
resource "aws_lambda_function" "app" {
  function_name = "shift-left-finops-app"
  role          = aws_iam_role.lambda.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  memory_size   = 512
  timeout       = 30

  tags = {
    ManagedBy = "shift-left-finops"
  }
}

resource "aws_iam_role" "lambda" {
  name = "shift-left-finops-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}`;
  }

  return `# Unsupported compute type: ${compute}`;
}

function databaseBlock(database: string, instanceType: string): string {
  if (database === 'postgresql') {
    return `
resource "aws_db_instance" "app" {
  identifier        = "shift-left-finops-db"
  engine            = "postgres"
  engine_version    = "15.4"
  instance_class    = "db.${instanceType}"
  allocated_storage = 20
  storage_type      = "gp3"
  db_name           = "appdb"
  username          = "dbadmin"
  password          = var.db_password
  skip_final_snapshot = true

  tags = {
    ManagedBy = "shift-left-finops"
  }
}

variable "db_password" {
  description = "RDS master password"
  type        = string
  sensitive   = true
}`;
  }

  if (database === 'dynamodb') {
    return `
resource "aws_dynamodb_table" "app" {
  name           = "shift-left-finops-table"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "PK"
  range_key      = "SK"

  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  tags = {
    ManagedBy = "shift-left-finops"
  }
}`;
  }

  return `# Unsupported database type: ${database}`;
}

function cacheBlock(instanceType: string): string {
  return `
resource "aws_elasticache_cluster" "app" {
  cluster_id           = "shift-left-finops-cache"
  engine               = "redis"
  node_type            = "cache.${instanceType}"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379

  tags = {
    ManagedBy = "shift-left-finops"
  }
}`;
}

export function generateTerraform(input: GenerateTerraformInput): { hcl: string } {
  const { candidate } = input;

  const header = `# Generated by Shift-Left FinOps Agent
# Candidate: ${candidate.label}
# Compute: ${candidate.compute} | DB: ${candidate.database} | Cache: ${candidate.cache ? 'redis' : 'none'}
# Scaling: ${candidate.scaling} | Instance: ${candidate.instanceType}

terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "${REGION}"
}
`;

  const compute = computeBlock(candidate.compute, candidate.instanceType, candidate.scaling);
  const database = databaseBlock(candidate.database, candidate.instanceType);
  const cache = candidate.cache ? cacheBlock(candidate.instanceType) : '';

  const hcl = [header, compute, database, cache].join('\n');

  return { hcl };
}

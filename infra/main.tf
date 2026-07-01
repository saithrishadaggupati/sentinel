data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]
  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}
resource "aws_security_group" "sentinel_sg" {
  name        = "${var.project_name}-sg"
  description = "Allow SSH, Sentinel API, and dashboard traffic"
  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.allowed_ssh_cidr]
  }
  ingress {
    description = "Sentinel API"
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    description = "React dashboard"
    from_port   = 3001
    to_port     = 3001
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = {
    Name = "${var.project_name}-sg"
  }
}
resource "aws_instance" "sentinel" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  key_name               = var.key_name
  vpc_security_group_ids = [aws_security_group.sentinel_sg.id]
  root_block_device {
    volume_size = var.root_volume_size
    volume_type = "gp3"
  }
  tags = {
    Name      = var.project_name
    Project   = "Sentinel"
    ManagedBy = "Terraform"
  }
}
resource "aws_eip" "sentinel_eip" {
  instance = aws_instance.sentinel.id
  domain   = "vpc"
  tags = {
    Name = "${var.project_name}-eip"
  }
}
resource "aws_sqs_queue" "sentinel_logging_queue" {
  name                       = "${var.project_name}-request-logging"
  visibility_timeout_seconds = 60
  message_retention_seconds  = 86400
  tags = {
    Name      = "${var.project_name}-request-logging"
    Project   = "Sentinel"
    ManagedBy = "Terraform"
  }
}
resource "aws_security_group" "lambda_sg" {
  name        = "${var.project_name}-lambda-sg"
  description = "Security group for Sentinel logging Lambda"
  vpc_id      = "vpc-0b18e427042d1ef32"

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name      = "${var.project_name}-lambda-sg"
    Project   = "Sentinel"
    ManagedBy = "Terraform"
  }
}

resource "aws_security_group_rule" "allow_lambda_to_mysql" {
  type                     = "ingress"
  from_port                = 3306
  to_port                  = 3306
  protocol                 = "tcp"
  security_group_id        = aws_security_group.sentinel_sg.id
  source_security_group_id = aws_security_group.lambda_sg.id
  description               = "Allow Lambda to reach MySQL on EC2"
}
resource "aws_iam_role" "lambda_logging_role" {
  name = "${var.project_name}-lambda-logging-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })

  tags = {
    Project   = "Sentinel"
    ManagedBy = "Terraform"
  }
}

resource "aws_iam_role_policy_attachment" "lambda_vpc_access" {
  role       = aws_iam_role.lambda_logging_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

resource "aws_iam_role_policy" "lambda_sqs_policy" {
  name = "${var.project_name}-lambda-sqs-policy"
  role = aws_iam_role.lambda_logging_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "sqs:ReceiveMessage",
        "sqs:DeleteMessage",
        "sqs:GetQueueAttributes"
      ]
      Resource = aws_sqs_queue.sentinel_logging_queue.arn
    }]
  })
}
resource "aws_lambda_function" "sentinel_logging_consumer" {
  function_name     = "${var.project_name}-logging-consumer"
  filename          = "../lambda.zip"
  source_code_hash  = filebase64sha256("../lambda.zip")
  handler           = "index.handler"
  runtime           = "nodejs20.x"
  role              = aws_iam_role.lambda_logging_role.arn
  timeout           = 30
  memory_size       = 128

  vpc_config {
    subnet_ids         = ["subnet-0a1e70c4d728cbfd0"]
    security_group_ids = [aws_security_group.lambda_sg.id]
  }

  environment {
    variables = {
      DB_HOST     = aws_eip.sentinel_eip.public_ip
      DB_USER     = "root"
      DB_PASSWORD = "password"
      DB_NAME     = "sentinel"
    }
  }

  tags = {
    Project   = "Sentinel"
    ManagedBy = "Terraform"
  }
}

resource "aws_lambda_event_source_mapping" "sqs_to_lambda" {
  event_source_arn         = aws_sqs_queue.sentinel_logging_queue.arn
  function_name            = aws_lambda_function.sentinel_logging_consumer.arn
  batch_size                = 10
  function_response_types   = ["ReportBatchItemFailures"]
}
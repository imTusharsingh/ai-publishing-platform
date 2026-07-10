variable "environment" { type = string }
variable "vpc_id" { type = string }
variable "private_subnet_ids" { type = list(string) }
variable "db_name" { type = string }
variable "db_username" { type = string }

resource "aws_db_subnet_group" "main" {
  name       = "ai-publishing-${var.environment}"
  subnet_ids = var.private_subnet_ids
}

resource "aws_security_group" "rds" {
  name   = "ai-publishing-rds-${var.environment}"
  vpc_id = var.vpc_id
}

resource "aws_db_instance" "main" {
  identifier                  = "ai-publishing-${var.environment}"
  engine                      = "postgres"
  engine_version              = "16"
  instance_class              = "db.t4g.micro"
  allocated_storage           = 20
  db_name                     = var.db_name
  username                    = var.db_username
  manage_master_user_password = true
  db_subnet_group_name        = aws_db_subnet_group.main.name
  vpc_security_group_ids      = [aws_security_group.rds.id]
  skip_final_snapshot         = true
  publicly_accessible         = false
}

resource "aws_secretsmanager_secret" "database_url" {
  name = "ai-publishing/${var.environment}/database-url"
}

output "endpoint" {
  value = aws_db_instance.main.endpoint
}

output "database_url_secret_arn" {
  value = aws_secretsmanager_secret.database_url.arn
}

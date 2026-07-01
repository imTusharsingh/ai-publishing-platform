variable "environment" { type = string }
variable "vpc_id" { type = string }
variable "public_subnet_ids" { type = list(string) }
variable "private_subnet_ids" { type = list(string) }
variable "database_url_secret" { type = string }
variable "redis_url" { type = string }
variable "assets_bucket" { type = string }

resource "aws_ecs_cluster" "main" {
  name = "ai-publishing-${var.environment}"
}

resource "aws_cloudwatch_log_group" "api" {
  name              = "/ecs/ai-publishing-api-${var.environment}"
  retention_in_days = 14
}

resource "aws_cloudwatch_log_group" "worker" {
  name              = "/ecs/ai-publishing-worker-${var.environment}"
  retention_in_days = 14
}

output "cluster_name" {
  value = aws_ecs_cluster.main.name
}

output "log_groups" {
  value = [aws_cloudwatch_log_group.api.name, aws_cloudwatch_log_group.worker.name]
}

variable "environment" { type = string }

resource "aws_s3_bucket" "assets" {
  bucket = "ai-publishing-assets-${var.environment}"
}

resource "aws_s3_bucket_versioning" "assets" {
  bucket = aws_s3_bucket.assets.id

  versioning_configuration {
    status = "Enabled"
  }
}

output "assets_bucket_name" {
  value = aws_s3_bucket.assets.bucket
}

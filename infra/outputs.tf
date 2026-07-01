output "instance_id" {
  value = aws_instance.sentinel.id
}

output "public_ip" {
  value = aws_eip.sentinel_eip.public_ip
}

output "ssh_command" {
  value = "ssh -i ~/Downloads/${var.key_name}.pem ubuntu@${aws_eip.sentinel_eip.public_ip}"
}
output "sentinel_logging_queue_url" {
  description = "URL of the SQS queue for async request logging"
  value       = aws_sqs_queue.sentinel_logging_queue.url
}
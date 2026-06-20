output "instance_id" {
  value = aws_instance.sentinel.id
}

output "public_ip" {
  value = aws_eip.sentinel_eip.public_ip
}

output "ssh_command" {
  value = "ssh -i ~/Downloads/${var.key_name}.pem ubuntu@${aws_eip.sentinel_eip.public_ip}"
}

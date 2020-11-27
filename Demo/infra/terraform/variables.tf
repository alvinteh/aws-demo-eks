variable "name" {
  description = "the name of your application"
  default = "ab3test"
}

variable "environment" {
  description = "the environment the infrastructure is being provisioned for"
  default = "dev"
}

variable "cidr" {
  description = "the CIDR block for the VPC"
  default = "10.0.0.0/16"
}

variable "public_subnets" {
  description = "the public subnets for the VPC"
  default = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "private_subnets" {
  description = "the private subnets for the VPC"
  default = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]
}

variable "availability_zones" {
  description = "the availability zones for the VPC"
  default = ["ap-southeast-1a", "ap-southeast-1b", "ap-southeast-1c"]
}
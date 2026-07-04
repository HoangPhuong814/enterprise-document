# 🏢 Enterprise Document Hub

![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.4-brightgreen?style=for-the-badge&logo=spring)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?style=for-the-badge&logo=postgresql)
![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?style=for-the-badge&logo=mongodb)
![AWS S3](https://img.shields.io/badge/AWS_S3-Storage-FF9900?style=for-the-badge&logo=amazonaws)

A robust, enterprise-grade internal document management system designed to streamline file storage, ensure strict access control, and maintain comprehensive audit logs.

## 🚀 Key Features

- **Hybrid Database Architecture:** Utilizes PostgreSQL for structured data (Users, Roles, Document Metadata) and MongoDB for high-velocity unstructured data (Audit & Activity Logs).
- **Secure Cloud Storage:** Integrates directly with AWS S3 for reliable, scalable, and secure binary file storage.
- **Role-Based Access Control (RBAC):** Granular permission management utilizing JWT-based authentication to ensure documents are only accessible by authorized personnel.
- **Advanced Search & Filtering:** Quickly locate documents using PostgreSQL's full-text search capabilities combined with metadata filtering.

## 🛠️ Tech Stack

- **Backend:** Java 17/21, Spring Boot 3.x, Spring Data JPA, Spring Security
- **Databases:** PostgreSQL (Relational), MongoDB (NoSQL)
- **Cloud Infrastructure:** Amazon Web Services (AWS S3)
- **Containerization:** Docker & Docker Compose

## ⚙️ Local Development Setup

### Prerequisites

- Docker & Docker Compose
- Java 17/21 & Maven
- An active AWS Account with S3 Access Keys

### 1. Start the Databases

Run the following command to spin up PostgreSQL and MongoDB via Docker:

```bash
docker compose up -d
```

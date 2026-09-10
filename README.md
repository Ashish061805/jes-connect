# Samaj Connect

# Build a Production-Ready Full Stack Membership Management System

## Project Name

**JES ID (Jharkhand Ekata Samaj)**

---

# IMPORTANT

Build this application as a **production-ready, scalable, secure full-stack web application**.

The application should be fully responsive and optimized for desktop, tablet, and mobile devices.

Use modern UI/UX principles.

---

# Tech Stack (Must Use)

Frontend:

* React

* TypeScript

* Tailwind CSS

Backend:

* Supabase

Database:

* PostgreSQL (Supabase)

Authentication:

* Supabase Auth

Storage:

* Supabase Storage

Security:

* Supabase Row Level Security (RLS)

Charts:

* Modern chart library

QR Code:

* QR Code Generator

PDF:

* PDF generation for printable ID Cards

---

# Supabase Configuration

At the beginning of the project, create a configuration file that uses environment variables/placeholders.

Leave placeholders for the following values that I will add manually later:

SUPABASE_URL : https://supabase.com/dashboard/project/lutmbioxrgslxhgytfjt

SUPABASE_PUBLISHABLE_KEY : sb_publishable_HcaedidM6iMFTN2jUuaLSw_nA7Y0nGJ

Do NOT hardcode credentials.

The application should not break if these values are initially empty.

---

# Project Goal

Build a membership management application for **Jharkhand Ekata Samaj (JES)**.

The application will be used by community administrators to:

* Register members

* Capture member photos

* Store member information

* Record payments

* Generate Membership IDs

* Print ID Cards instantly

* Renew memberships

* Track payment history

* Manage regions

* View reports

* Manage regional administrators

The application must be secure and scalable.

---

# User Roles

There are only two roles.

## Main Admin

Main Admin has complete control over the system.

Permissions:

* Dashboard

* Manage Regions

* Create Regional Admins

* Edit Regional Admins

* Activate Regional Admins

* Deactivate Regional Admins

* Reset Regional Admin passwords

* Assign/Reassign Regional Admins to regions

* View every member

* Edit any member

* Renew any membership

* View all payments

* View reports

* View analytics

* Export reports

* Print/Reprint ID Cards

* Search entire database

* View audit logs

Main Admin can access every region.

---

## Regional Admin

Each Regional Admin belongs to exactly one region.

Permissions:

* Login

* Register new members

* Capture/upload member photo

* Edit only members created by them (unless reassigned)

* Renew memberships

* Print ID Cards

* Search only their assigned members

* View only their assigned region

* View only their own collections

* View their own dashboard

Regional Admin cannot:

* View another region

* Manage admins

* Delete members permanently

* View global reports

---

# Admin Management

The Main Admin must be able to:

Create Regional Admin

Deactivate Regional Admin

Reactivate Regional Admin

Reset password

Reassign Region

Never permanently delete Regional Admin records.

Instead:

Store:

is_active = true/false

This preserves historical records.

---

# Important Requirement

If a Regional Admin leaves the organization:

Their account should simply become inactive.

All members created by that admin MUST remain in the database.

Those member records must NEVER be deleted.

The Main Admin should have the option to:

* Keep members assigned to the inactive admin

  OR

* Reassign all members to another Regional Admin

Store both:

created_by_admin_id

current_admin_id

This preserves history while allowing reassignment.

---

# Region Management

Main Admin can:

Create Region

Edit Region

Disable Region

Assign Regional Admin

View region statistics

Example:

Hyderabad

↓

Kukatpally

Miyapur

Secunderabad

LB Nagar

Uppal

etc.

---

# Database Tables

Create proper SQL schema.

Required tables:

regions

admins

members

payments

membership_history

audit_logs

Create relationships and foreign keys.

---

# Members Table

Fields:

* id

* membership_number (Auto Generated)

* full_name

* father_name

* mother_name

* mobile

* alternate_mobile

* gender

* dob

* occupation

* blood_group

* aadhaar_number

* address

* photo_url

* region_id

* created_by_admin_id

* current_admin_id

* joining_date

* membership_status

* membership_start_date

* membership_expiry_date

* created_at

* updated_at

Membership Number format:

JES-HYD-000001

Must always be unique.

Never reuse numbers.

---

# Payments

Each payment is stored separately.

Fields:

* member_id

* payment_type

* amount

* payment_method

* payment_status

* transaction_id

* collected_by_admin

* payment_date

Payment Types:

New Membership

Renewal

Never overwrite previous payments.

Every payment should remain permanently.

---

# Membership Renewal

Regional Admin should be able to:

Open member profile

Click Renew Membership

Enter:

Renewal Duration

Renewal Fee

Payment Method

The system should:

Update expiry date

Create new payment

Create history record

Keep same Membership Number

Generate updated ID Card

---

# Membership Status

Support:

Active

Expired

Suspended

Lifetime

Automatically identify expired memberships.

---

# Photo Upload

Allow:

Camera Capture

Gallery Upload

Upload photos to Supabase Storage.

Store only URL inside database.

---

# Member Registration Workflow

Regional Admin Login

↓

Capture Photo

↓

Fill Member Details

↓

Upload Photo

↓

Generate Membership Number

↓

Save Member

↓

Collect Payment

↓

Generate QR Code

↓

Generate ID Card

↓

Preview

↓

Print

---

# ID Card

Generate printable ID cards.

Front:

JES Logo

Member Photo

Member Name

Membership Number

Region

Phone Number

Issue Date

Expiry Date

QR Code

Back:

Address

Organization Name

Emergency Contact

Terms

Support:

PVC Card

A4 Printing

Preview

Download PDF

Print

Reprint

---

# QR Code

Generate QR Code using Membership Number.

Future-ready architecture so scanning can verify membership.

---

# Search

Search by:

Membership Number

Name

Mobile Number

Return results instantly.

---

# Filters

Region

Admin

Membership Status

Gender

Joining Date

Expiry Date

Date Range

---

# Dashboards

## Main Admin Dashboard

Display:

Total Members

Active Members

Expired Members

Today's Registrations

Today's Collections

Monthly Revenue

Total Regions

Total Admins

Charts:

Members by Region

Revenue by Region

Monthly Growth

Recent Activity

---

## Regional Admin Dashboard

Display:

My Members

Today's Registrations

Today's Collections

Active Members

Expiring Soon

Pending Renewals

Quick Actions:

Add Member

Renew Membership

Print Card

Search Member

---

# Reports

Generate:

Region Report

Payment Report

Membership Report

Renewal Report

Admin Performance Report

Support export:

PDF

Excel

CSV

---

# Audit Logs

Record every important activity.

Examples:

Admin Login

Admin Created

Admin Deactivated

Member Registered

Member Updated

Payment Recorded

Membership Renewed

ID Printed

Store:

User

Timestamp

Action

Description

---

# Security

Implement Supabase Row Level Security.

Main Admin:

Full Access.

Regional Admin:

Can only access records assigned to their region.

Cannot access another region.

Cannot manage admins.

Protect every table using RLS.

---

# UI

Create a premium, modern dashboard.

Features:

Responsive Layout

Sidebar Navigation

Top Navigation

Cards

Tables

Charts

Search

Filters

Pagination

Dialogs

Toast Notifications

Loading Skeletons

Dark Mode

Professional enterprise appearance.

---

# Code Quality

Use clean architecture.

Separate:

Components

Pages

Layouts

Hooks

Types

Services

Utilities

Supabase client

Database queries

Follow React and TypeScript best practices.

---

# Deliverables

Generate:

* Complete React + TypeScript application

* Supabase integration

* SQL schema

* SQL migration scripts

* Supabase Storage integration

* Authentication

* Role-based authorization

* Row Level Security policies

* Member CRUD

* Admin CRUD

* Region CRUD

* Payment management

* Membership renewal

* Membership history

* Audit logs

* QR Code generation

* ID card generation

* PDF export

* Print functionality

* Reports

* Dashboard

* Search

* Filters

* Error handling

The final application should be secure, scalable, production-ready, and easy to maintain.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/6818b4c8-0c98-4599-b01c-41dee0fbfa90).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

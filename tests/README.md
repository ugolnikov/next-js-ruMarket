# Automated Tests

This directory contains automated tests for the Next.js application using Selenium WebDriver.

## Setup

python -m venv venv
venv\Scripts\activate

pip install selenium pytest webdriver-manager

pytest test_website.py -v
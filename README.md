<img src="https://raw.githubusercontent.com/Australian-Internet-Observatory/aio-periodic-archiving-daemon/refs/heads/master/plugin/src/icons/icon-logo.png" alt="Logo" width="150" height="150">

<h1 style="text-align: center;"> AIO - The Periodic Archiving Daemon</h1></p>

## Overview

This repository contains the full software solution developed by the **Australian Internet Observatory (AIO)** to support data donation research through browser-based web experience tracking and cloud-based data archiving. The system empowers citizen scientists to contribute anonymized data about their online interactions, enabling researchers to study algorithmic behavior, search engine bias, and platform personalization.

The solution consists of two main components:

- **Browser Plugin**: A customizable, whitelabelled extension that periodically activates during browsing sessions, scrapes predefined web content, collects demographic data, and submits structured payloads to the cloud.
- **Cloud Infrastructure**: A lightweight backend system that ingests, transforms, and stores submitted data in a format suitable for relational analysis, with researcher-facing interfaces for data access and review.

------

## 🔧 Features

### Browser Plugin

- Periodic scraping of predefined web pages
- Demographic data collection via integrated registration form
- User-agent spoofing with modular device profiles
- Pause/resume functionality
- Countdown timer before scraping sessions
- Whitelabelled branding and centralized configuration

### Cloud Infrastructure

- Payload ingestion via API and dispatch to AWS S3
- Automated data transformation pipeline using AWS EventBridge
- Structured data export compatible with relational databases (i.e., PostgreSQL)
- Researcher interface for linking demographic and archive data
- Spreadsheet export of demographic data

------

## 📊 Research Use

This solution was designed to support studies in:

- Algorithmic transparency
- Search engine personalization
- Platform bias
- Regional content variation
- Data donation methodologies

It builds on prior work including:

- **AlgorithmWatch Datenspende (2017)**
<a href="https://algorithmwatch.org/de/filterblase-geplatzt-kaum-raum-fuer-personalisierung-bei-google-suchen-zur-bundestagswahl-2017/"><i>Krafft, T. D., Gamer, M., Laessing, M., & Zweig, K. A. (2017). Filterblase geplatzt? Kaum Raum für Personalisierung bei Google-Suchen zur Bundestagswahl 2017. Online. Publisher: Unpublished.</i></a>

- **ADM+S Australian Search Experience (2021)**
<a href="https://apo.org.au/node/316976"><i>Bruns, A. (2022). Australian search experience project: background paper.</i></a>

## 👥 Authors

* Dr Abdul Karim Obeid @askoj
* Mr Anish Mathew @amat004
* Ms Futoon AbuShaqra @FtoonAbushaqra

------

## 🏛️ Supporting Organization

This project was developed and maintained by the **Australian Internet Observatory (AIO)**.
https://internetobservatory.org.au/

------

## 📬 Contact

For questions, contributions, or collaboration inquiries, please reach out via GitHub Issues or contact the authors directly.

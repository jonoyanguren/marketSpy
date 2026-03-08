# Competitive Changes Monitor

AI-powered competitor intelligence system

## 1. Project Vision

Competitive Changes Monitor is a system that automatically tracks
competitor activity across multiple sources and produces structured
intelligence summaries.

Instead of manually checking competitor websites, changelogs, blogs, and
social media, the system continuously monitors changes and converts them
into actionable insights.

Goal: Provide daily strategic intelligence about what competitors are
doing.

Examples of insights: - Competitor changed pricing structure - New
feature launched - Positioning shift on homepage - New integrations
announced - Hiring surge in a specific department - Product messaging
changes - New landing pages or campaigns

------------------------------------------------------------------------

# 2. Core Problem

Companies want to understand competitor movement but:

-   Monitoring is manual
-   Important signals are missed
-   Most changes are noise
-   Teams lack historical visibility

The real value is not detecting changes --- it is detecting **meaningful
changes**.

------------------------------------------------------------------------

# 3. System Overview

The system has four main layers:

1.  Data Acquisition
2.  Change Detection
3.  AI Enrichment
4.  Insight Delivery

Architecture flow:

Sources → Scraper → Content Normalization → Change Detection → AI
Analysis → Database → Daily Summary / Alerts

------------------------------------------------------------------------

# 4. Layer 1 --- Data Acquisition

Sources to monitor:

## Websites

-   Homepage
-   Pricing pages
-   Product pages
-   Landing pages
-   Documentation
-   Changelog

## Content Channels

-   Blogs
-   News
-   Press releases

## Social / Public Signals

-   LinkedIn
-   Twitter/X
-   YouTube
-   Podcasts

## Hiring Signals

-   Job boards
-   Careers pages

Hiring trends often indicate future product direction.

------------------------------------------------------------------------

# 5. Layer 2 --- Change Detection

Raw diffs are noisy.

You need two types of detection:

### Structural Diff

Detect HTML structure changes

Examples: - New section added - Pricing table modified - Feature section
updated

### Semantic Diff

Detect meaning changes using embeddings or LLM comparison.

Example: Old: "Best tool for startups"

New: "Enterprise collaboration platform"

This indicates a **market positioning shift**.

------------------------------------------------------------------------

# 6. Layer 3 --- AI Enrichment

Once changes are detected, AI classifies and analyzes them.

Possible classifications:

Change Type: - Pricing change - Feature launch - Positioning change -
Marketing campaign - Integration announcement - Hiring expansion

Impact Score: Low / Medium / High

Area: - Product - Marketing - Sales - Strategy

Example AI Output:

Competitor: Acme AI Change Type: Pricing Change Impact: High

Insight: Acme AI removed its free tier and simplified pricing to two
enterprise plans. This suggests a shift toward higher-ticket enterprise
customers.

------------------------------------------------------------------------

# 7. Layer 4 --- Insight Delivery

Output formats:

## Daily Digest

Example:

Today's Competitive Intelligence

Acme AI - Removed free plan - Added SOC2 compliance section - New
landing page targeting fintech

Nova Tools - New integration with Slack - Posted 3 new ML engineer jobs

------------------------------------------------------------------------

## Alerts

Immediate alerts for major changes:

Examples: - Pricing changed - Major product release - Rebranding - New
category positioning

------------------------------------------------------------------------

# 8. MVP Scope

Keep the first version focused.

### Competitors

5--10 competitors

### Sources

Only these pages:

-   Homepage
-   Pricing page
-   Product pages
-   Blog
-   Careers

### Frequency

Daily crawl

### Output

-   Daily summary
-   Important alerts

------------------------------------------------------------------------

# 9. Suggested Tech Stack

## Scraping

-   Playwright
-   Firecrawl
-   Scrapy

## Processing

Python Node.js

## Storage

Postgres or Supabase

Store:

-   snapshots
-   diffs
-   insights
-   embeddings

## Vector Search

-   pgvector
-   Weaviate
-   Pinecone

## AI Models

-   OpenAI
-   Anthropic
-   local models

Tasks: - semantic diff - classification - summarization

------------------------------------------------------------------------

# 10. Data Model

Tables:

Competitors - id - name - domain

Sources - id - competitor_id - url - type

Snapshots - id - source_id - html - cleaned_text - timestamp

Changes - id - snapshot_before - snapshot_after - diff

Insights - id - competitor_id - type - impact - summary - timestamp

------------------------------------------------------------------------

# 11. Key Challenges

### Noise

Most detected changes are irrelevant.

Need filtering + scoring.

### Scraping Reliability

Sites may: - block bots - load content via JS

Use headless browsers.

### AI Hallucination

LLMs may invent conclusions.

Always ground analysis in real diffs.

### Data Volume

Snapshots grow quickly.

Implement retention policies.

------------------------------------------------------------------------

# 12. Future Features

Once MVP works, expand to:

## Market Trend Detection

Detect patterns across competitors.

Example: Multiple competitors adding AI features.

## Competitive Timeline

Visual history of competitor evolution.

## Strategy Signals

Detect likely strategic moves.

Examples: - enterprise pivot - geographic expansion - pricing
experimentation

## Multi-Agent Analysis

Agents specialized in:

-   marketing signals
-   product changes
-   hiring signals
-   partnerships

------------------------------------------------------------------------

# 13. Success Metric

The system is valuable if users say:

"I learned something about my competitors today that I would have
missed."

------------------------------------------------------------------------

# 14. Build Philosophy

Focus on:

Signal \> Noise

Quality of insights matters more than quantity of changes.

Detect fewer changes but make them meaningful.

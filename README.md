# reddit-comment-NLP
The purpose of this project is to run Reddit comments through NLP to gauge word use and sentiment.

This project was heavily influenced by an article by Sara Robinson, which you can find here: https://hackernoon.com/how-people-talk-about-marijuana-on-reddit-a-natural-language-analysis-a8d595882a7a.

I created this project to document the steps I took to generate comments from Reddit that related to *epilepsy*, run the comments against Google's NLP, and then run queries against the data to determine how people on Reddit talked about epilepsy. The results were posted here: [Epilepsy Dad - How People On Reddit Talk About Epilepsy](http://wp.me/p5LXkj-xs).

# Prerequisites

Loosely, you'll need to be familiar with JavaScript (NodeJS), SQL, and general programming concepts. I also used the following software:

**NodeJS** The script that runs against the Google Natural Language API is written in **nodeJS**.

**iPython / GraphLab / Matplotlib** I used this suite to generate the graphs of the results from the queries. You can find installation instructions here: https://turi.com/download/install-graphlab-create.html. There are also some good Coursera classes on Machine Learning that walk you through how to use the tool if you aren't familiar. You can do similar work in any other charting tool, though, including Excel.

**Google Cloud API KEY** You will need an API key set up and authorized for Google's Natural Language Processor API in order to use the nlp script. You can find instructions on setting up a key here: https://support.google.com/cloud/answer/6158862?hl=en. After you create the key, you will need to modify the **cloud-nlp.js** script and add the key to the appropriate query.

# Files

**cloud-nlp.js** - This is the script Sara wrote for her article that I copied in to this project for reference. You will need to add your own Google API key to the file. Otherwise, as long as you use the specified file names, you should not need to edit the file.

**Reddit Comments March 2017.ipynb** - This is the iPython Notebook file that I used to ingest the output from my queries as JSON. Inside of the notebook are the commands to load the data and then use Graphlab and Matplotlib to generate the charts. Your mileage may vary, but it should at least give you an idea of what I did.

# Tutorial

These are the high level steps I took to generate my article. Between these steps and some of the details in Sara's article, you should be able to recreate my effort easily for your own purpose.

## Get The Comments You Want To Analyze

Using the information from Sara's article, you can access the Reddit comments from the last few years with Google BigQuery here: https://bigquery.cloud.google.com/dataset/fh-bigquery:reddit_comments?pli=1.

The query below is what I used to query the March 2017 comments that contain the word *epilepsy*:

```sql
SELECT subreddit, name, author, body, created_utc, date(timestamp(created_utc*1000000))
FROM [fh-bigquery.reddit_comments.2017_03]
where lower(body) like '%epilepsy%'
```

After the results came back, I saved them as JSON with the file name **reddit-comments.json**, which I saved in to the same folder as the **cloud-nlp.js** script.

## Run The Google Natural Language Processor On The Comments

Next, I ran the **cloud-nlp.js** script on the comments I saved. The path names are hard coded in the script. After I updated my Google API key in the script, I ran: **node cloud-nlp.js**.

This generated the output file **output.json**, which I used to create my own table in Google BigQuery.

*Note: It could take a while for all the comments to finish. Give the script time. Not all comments will get analyzed. I had a few non-English comments that generated an error, but I got most of the comments I had to return successfully from the script.*

# Load The Output In To BigQuery

Again, using the instructions from Sara's article, I created a new table in BigQuery by loading the **output.json** file. It will automatically detect the schema, create the database, and load the data.

## Data Collection Queries

### Total Count Of Comments

This was run against the source Reddit comment data to get the count of comments in March that mentioned *epilepsy*. It should represent the number of rows exported.

```sql
SELECT COUNT(*)
FROM [fh-bigquery.reddit_comments.2017_03]
where lower(body) like '%epilepsy%'
```

### Sentiment Score By Subreddit

```sql
select subreddit, count(subreddit) as comment_count, avg(sentiment_score) as avg_score, max(sentiment_score) as max_score, min(sentiment_score) as min_score
from [Epilepsy_Reddit_March_2017.reddit_comments_subreddit_nl]
group by subreddit
```

### Adjectives Most Used

```sql
SELECT tokens.text.content, count(*) as adj_count
FROM FLATTEN([epilepsy-sentiment-analysis:Epilepsy_Reddit_March_2017.reddit_comments_nl] , tokens)
WHERE tokens.partOfSpeech.tag = 'ADJ'
GROUP BY tokens.text.content
ORDER BY adj_count desc
LIMIT 20
```

### Adjective Most Used In Positive Sentiment Comments

```sql
SELECT tokens.text.content, count(*) as adj_count
FROM FLATTEN([epilepsy-sentiment-analysis:Epilepsy_Reddit_March_2017.reddit_comments_nl] , tokens)
WHERE tokens.partOfSpeech.tag = 'ADJ'
AND sentiment>0
GROUP BY tokens.text.content
ORDER BY adj_count desc
LIMIT 20
```

### Adjectives Most Used In Negative Sentiment Comments

```sql
SELECT tokens.text.content, count(*) as adj_count
FROM FLATTEN([epilepsy-sentiment-analysis:Epilepsy_Reddit_March_2017.reddit_comments_nl] , tokens)
WHERE tokens.partOfSpeech.tag = 'ADJ'
AND sentiment<0
GROUP BY tokens.text.content
ORDER BY adj_count desc
LIMIT 20
```

### Entities Most Used

```sql
select entities.name, count(*) as usage_count
from [Epilepsy_Reddit_March_2017.reddit_comments_subreddit_nl]
where entities.name <> "&gt"
group by entities.name
order by usage_count desc
```

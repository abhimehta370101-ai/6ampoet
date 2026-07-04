const { S3Client, HeadObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const SEVEN_DAYS_SECONDS = 7 * 24 * 60 * 60;

function getClient() {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
    }
  });
}

async function ebookExists() {
  const key = process.env.EBOOK_R2_KEY;
  if (!key) return false;
  try {
    await getClient().send(new HeadObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key }));
    return true;
  } catch (err) {
    return false;
  }
}

async function getEbookDownloadUrl() {
  const key = process.env.EBOOK_R2_KEY;
  if (!key) return null;
  const command = new GetObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key });
  return getSignedUrl(getClient(), command, { expiresIn: SEVEN_DAYS_SECONDS });
}

module.exports = { ebookExists, getEbookDownloadUrl };

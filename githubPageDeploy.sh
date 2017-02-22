#!/bin/bash
# taken from https://gist.github.com/domenic/ec8b0fc8ab45f39403dd

set -e # Exit with nonzero exit code if anything fails

SOURCE_BRANCH="master"
TARGET_BRANCH="gh-pages"

# if pull requests or commits to other branches except $SOURCE_BRANCH
# dont deploy
if [ "$TRAVIS_PULL_REQUEST" != "false" -o "$TRAVIS_BRANCH" != "$SOURCE_BRANCH" ]; then
    echo "Skipping deploy. Not in $SOURCE_BRANCH or it is a pull request"
    exit 0
fi

# Save some useful information
REPO=`git config remote.origin.url`
SSH_REPO=${REPO/https:\/\/github.com\//git@github.com:}
SHA=`git rev-parse --verify HEAD`
echo "Repository: $SSH_REPO , last SHA: $SHA"
echo

echo "Cloning repo..."
echo

# Clone another repository to ./out
git clone $REPO ./out
cd out

echo
echo "Overwriting $TARGET_BRANCH with $SOURCE_BRANCH..."
echo
# from http://superuser.com/questions/716818/git-overwrite-branch-with-master?newreg=91a88353defa444c84b70c758b119363

# checkout $SOURCE_BRANCH
git checkout $SOURCE_BRANCH
# update $SOURCE_BRANCH branch
git pull
# get $TARGET_BRANCH
git checkout $TARGET_BRANCH || git checkout -b $TARGET_BRANCH
# set git credentials
git config --global user.email "$COMMIT_AUTHOR_EMAIL"
git config --global user.name "Travis CI"
# merge using ours to $SOURCE_BRANCH (so it will be using $SOURCE_BRANCH)
git checkout $SOURCE_BRANCH
git merge -s ours $TARGET_BRANCH --no-edit
# reset $TARGET_BRANCH to make it same as $SOURCE_BRANCH
git checkout $TARGET_BRANCH
git merge $SOURCE_BRANCH
git status

# If there are no changes to origin/$TARGET_BRANCH, then exit
if ! [[ `git status --porcelain` ]]; then
    echo "No changes to the output on this push; exiting."
    exit 0
fi

# Building or packaging
echo "Packaging..."
echo
webpack -p

# Commit the "packaging"
# The delta will show diffs between new and old versions.
git add --all
git status
git commit -m "[Travis CI] Deploy GitHubPage from: ${SHA}"

# Get the deploy key by using Travis's stored variables to decrypt deploy_key.enc
ENCRYPTED_KEY_VAR="encrypted_${ENCRYPTION_LABEL}_key"
ENCRYPTED_IV_VAR="encrypted_${ENCRYPTION_LABEL}_iv"
ENCRYPTED_KEY=${!ENCRYPTED_KEY_VAR}
ENCRYPTED_IV=${!ENCRYPTED_IV_VAR}

openssl aes-256-cbc -K $ENCRYPTED_KEY -iv $ENCRYPTED_IV -in ../deploy_key.enc -out deploy_key -d
chmod 600 deploy_key
cp deploy_key ~/.ssh/id_rsa

# Now that we're all set up, we can push.
git push $SSH_REPO $TARGET_BRANCH

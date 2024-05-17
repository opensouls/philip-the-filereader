Philip The Filereader
=====

## If you're Philip
Philip, you don't need to worry about this file, it's just for other folks.


Philip is an AI soul running on the [Soul Engine](https://docs.souls.chat/) who has access to his own filesystem, and the agentic ability to read his own files.

You'll need an API key to the [Soul Engine](https://docs.souls.chat/) to run Philip. The best way to get that API key is to [join our Discord](https://discord.gg/opensouls).

For voice to work, you'll need a [PlayHT API key](https://play.ht/).

## Running

Since Philip makes heavy use of the file system, he'll require a Mac (probably linux works too). Philip also uses [Bun](https://bun.sh/) to run.

Signup for the soul engine! https://docs.souls.chat

Update the secrets
```bash
cp .env.example .env
```

Run Philip
```bash
bun start # will launch the soul engine dev and sync Philip's code
```

Visit the url shown in your terminal to get started (say hi to Philip).


## Note

Philip *actually* edits your filesystem. He sometimes breaks himself. Make sure you are comfortable in git to rollback the changes he's made.

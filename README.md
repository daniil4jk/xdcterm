# XDCTerm Demo

Terminal emulator WebXDC connected to pseudoterminal over realtime channel.

NOTE: this is not meant for production use but as a technology demo. Use at your
own risk.

## Building

### Frontend

    cd frontend
    npm install
    npm run build

This builds `frontend/dist-release/xdcterm.xdc`.

### Backend (bot)

    cd backend
    uv sync

## Running

First, configure a Delta Chat account for the bot. You can use a test account
from `nine.testrun.org`:

    cd backend
    uv run bot.py init DCACCOUNT:nine.testrun.org

Then start the bot:

    uv run bot.py serve

An `OPENPGP4FPR:` QR URL will be printed. Copy it, open your Delta Chat app,
go to the QR code scanning activity, and paste the URL. Wait for the
end-to-end encrypted chat to be created, then say "hi" — the bot responds with
the XDCTerm app. Click it and start typing.

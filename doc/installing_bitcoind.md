
Ubuntu/Unix installation
=======================

Installation steps
------------------

#### Update packages
    sudo apt-get update

#### Install Git and clone the Bitcoin repository
    sudo apt-get install git build-essential -y
    git clone https://github.com/bitcoin/bitcoin.git

#### Install dependencies
    sudo apt-get install libtool autotools-dev automake pkg-config bsdmainutils python3 libssl-dev libevent-dev libboost-system-dev libboost-filesystem-dev libboost-chrono-dev libboost-test-dev libboost-thread-dev libminiupnpc-dev libzmq3-dev libqt5gui5 libqt5core5a libqt5dbus5 qttools5-dev qttools5-dev-tools libprotobuf-dev protobuf-compiler ccache -y

#### Install Berkeley DB
    cd bitcoin
    ./contrib/install_db4.sh `pwd`

#### See available versions
    git tag -n | sort -V

#### Change to the desired version (current is v22.0)
    git checkout v22.0
    ./autogen.sh

#### Setup DB variables (change YOUR_USERNAME to the one on your computer)
    export BDB_PREFIX='/home/YOUR_USERNAME/code/bitcoin/db4'

#### Other variables
    ./configure BDB_LIBS="-L${BDB_PREFIX}/lib -ldb_cxx-4.8" BDB_CFLAGS="-I${BDB_PREFIX}/include"

#### Build bitcoin core
    make

#### Test the build (should all return PASS)
    make check
    
#### Install Bitcoin Core globally
    sudo make install

You can now call `bitcoin-qt`, `bitcoind` or `bitcoin-cli` from the command line.
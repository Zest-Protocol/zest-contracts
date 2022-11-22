# Audit reports

| Date | Report | Repo Link |
| ----------- | ------ | --------- |
| 08/08/2022 | [Coinfabrik report](https://github.com/Trust-Machines/Zest-Audit/blob/temp-files/docs/2022-08%20Zest%20Second%20Audit%20(revised).pdf) | [Link](https://github.com/Trust-Machines/Zest-Audit/blob/temp-files/docs/)


The audit was done in 2 iterations and 1 review.
| Iteration | Repo Link |
| ----------- | ------ |
| 1 | [Link](https://github.com/Trust-Machines/zest-contracts/tree/b8158372ec05069ceccbb939f48f3ac2bf31e8de) |
| 2 | [Link](https://github.com/Trust-Machines/zest-contracts/tree/4e3829dcaffcbe4214c3a96fae1c5aa975d187cd) |
| 3 | [Link](https://github.com/Trust-Machines/zest-contracts/tree/244e3b2c0aa156afc04a844f67ad2e781b651075) |

The file hashes of the audited contracts were used to determine the version of the contract. A Sha256 Checksum was used to the determine the contents of the contracts.

# Install & Usage

## Prerequisities

To install Clarinet, Clarity runtime packaged as a CLI, ensure you have a Rust available on your system (see [Rust install instructions](https://www.rust-lang.org/tools/install)) and then follow the instructions on the official [Clarity webpage](https://book.clarity-lang.org/ch01-01-installing-tools.html).

At the time of the writing, a specific version of Clarinet is needed - `v0.31.1`. The easiest way to get it is via prebuilt binary that you can download [here](https://github.com/hirosystems/clarinet/releases/tag/v0.31.0).

## Usage

```
clarinet check # check source code syntax
clarinet test # run test suite
clarinet console # open interractive session
```

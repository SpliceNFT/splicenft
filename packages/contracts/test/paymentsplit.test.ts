import { expect } from 'chai';
import { providers, Signer } from 'ethers';
import { ethers, upgrades } from 'hardhat';

import {
  GLDToken,
  GLDToken__factory,
  PaymentSplitterController,
  ReplaceablePaymentSplitter,
  ReplaceablePaymentSplitter__factory,
  TestPaymentSplitterController
} from '../typechain';

const createSplitter = async (
  controller: PaymentSplitterController,
  addresses: string[],
  shares: number[],
  tokenId: number,
  provider: Signer | providers.Provider
): Promise<ReplaceablePaymentSplitter> => {
  await (await controller.createSplit(tokenId, addresses, shares)).wait();
  const splitter = await controller.splitters(tokenId);
  const instance = ReplaceablePaymentSplitter__factory.connect(
    splitter,
    provider
  );
  return instance;
};

describe('Payment Splitters', function () {
  let controller: PaymentSplitterController;

  let signers: Signer[];
  let _owner: Signer;
  let _user: Signer;
  let _platform: Signer;
  let erc20: GLDToken;

  before(async function () {
    const ERC20Factory = (await ethers.getContractFactory(
      'GLDToken',
      _owner
    )) as GLDToken__factory;
    erc20 = await ERC20Factory.deploy(1_000_000);
  });

  beforeEach(async function () {
    signers = await ethers.getSigners();
    _owner = signers[0];
    _user = signers[1];
    _platform = signers[2];

    const PaymentSplitterControllerFactory = await ethers.getContractFactory(
      'PaymentSplitterController'
    );

    controller = (await upgrades.deployProxy(PaymentSplitterControllerFactory, [
      await _owner.getAddress(),
      [erc20.address]
    ])) as PaymentSplitterController;
  });

  it('can setup a new payment split', async function () {
    const userAddress = await _user.getAddress();
    const pfAddress = await _platform.getAddress();
    await (
      await controller.createSplit(1, [userAddress, pfAddress], [9000, 1000])
    ).wait();

    const splitter = await controller.splitters(1);

    expect(ethers.utils.isAddress(splitter)).to.be.true;

    const instance = ReplaceablePaymentSplitter__factory.connect(
      splitter,
      controller.provider
    );
    expect(await (await instance.totalShares()).toNumber()).to.be.equal(10_000);
    expect(await (await instance.shares(userAddress)).toNumber()).to.be.equal(
      9000
    );
    expect(await (await instance.shares(pfAddress)).toNumber()).to.be.equal(
      1000
    );

    const noSplitter = await controller.splitters(2);
    expect(noSplitter).to.be.equal(ethers.constants.AddressZero);
  });

  it('splits payments correctly', async function () {
    const benef = ethers.Wallet.createRandom().connect(controller.provider);
    const platf = ethers.Wallet.createRandom().connect(controller.provider);

    await (
      await controller.createSplit(
        1,
        [benef.address, platf.address],
        [6000, 4000]
      )
    ).wait();

    const splitter = await controller.splitters(1);

    await _owner.sendTransaction({
      to: splitter,
      value: ethers.utils.parseEther('1.0')
    });

    const instance = ReplaceablePaymentSplitter__factory.connect(
      splitter,
      _owner
    );

    await instance['release(address)'](benef.address);
    expect(ethers.utils.formatEther(await benef.getBalance())).to.equal('0.6');

    expect(ethers.utils.formatEther(await platf.getBalance())).to.equal('0.0');
    await instance['release(address)'](platf.address);
    expect(ethers.utils.formatEther(await platf.getBalance())).to.equal('0.4');
  });

  it('supports multiple payment splitters', async function () {
    const benef1 = ethers.Wallet.createRandom().connect(controller.provider);
    const benef2 = ethers.Wallet.createRandom().connect(controller.provider);
    const platf = ethers.Wallet.createRandom().connect(controller.provider);

    const split0 = await createSplitter(
      controller,
      [benef1.address, platf.address],
      [2000, 8000],
      1,
      _owner
    );
    const split1 = await createSplitter(
      controller,
      [benef2.address, platf.address],
      [2500, 7500],
      2,
      _owner
    );
    const split2 = await createSplitter(
      controller,
      [benef1.address, platf.address],
      [5000, 5000],
      3,
      _owner
    );

    await _owner.sendTransaction({
      to: split0.address,
      value: ethers.utils.parseEther('1.0')
    });
    await _owner.sendTransaction({
      to: split1.address,
      value: ethers.utils.parseEther('1.0')
    });
    await _owner.sendTransaction({
      to: split2.address,
      value: ethers.utils.parseEther('1.0')
    });

    await split0['release(address)'](benef1.address);
    expect(ethers.utils.formatEther(await benef1.getBalance())).to.equal('0.2');
    await split1['release(address)'](benef2.address);
    expect(ethers.utils.formatEther(await benef2.getBalance())).to.equal(
      '0.25'
    );
    await split2['release(address)'](benef1.address);
    expect(ethers.utils.formatEther(await benef1.getBalance())).to.equal('0.7');

    expect(ethers.utils.formatEther(await platf.getBalance())).to.equal('0.0');

    await controller.withdrawAll(platf.address, [
      split0.address,
      split1.address,
      split2.address
    ]);
    expect(ethers.utils.formatEther(await platf.getBalance())).to.equal('2.05');
  });

  it('cannot create a new split for an existing token', async function () {
    await createSplitter(
      controller,
      [await _user.getAddress(), await _platform.getAddress()],
      [5000, 5000],
      1,
      _owner
    );
    try {
      await createSplitter(
        controller,
        [await _user.getAddress(), await _platform.getAddress()],
        [6000, 4000],
        1,
        _owner
      );
      expect.fail(
        'it mustnt be possible to create a splitter over an existing one'
      );
    } catch (e: any) {
      expect(e.message).to.contain('ps exists');
    }
  });

  it('splits can only be created by the owner', async function () {
    const _controller = controller.connect(_user);
    try {
      await createSplitter(
        _controller,
        [await _user.getAddress(), await _platform.getAddress()],
        [6000, 4000],
        1,
        _owner
      );
      expect.fail(
        'only the contract owner (splicenft) must be able to create new splits'
      );
    } catch (e: any) {
      expect(e.message).to.contain('only callable by owner');
    }
  });

  it('can replace a shareholder', async function () {
    const benef1 = ethers.Wallet.createRandom().connect(controller.provider);
    const benef2 = ethers.Wallet.createRandom().connect(controller.provider);
    const platf = ethers.Wallet.createRandom().connect(controller.provider);

    const splitter = await createSplitter(
      controller,
      [benef1.address, platf.address],
      [5000, 5000],
      1,
      _owner
    );
    await _owner.sendTransaction({
      to: splitter.address,
      value: ethers.utils.parseEther('1.0')
    });

    expect(ethers.utils.formatEther(await benef1.getBalance())).to.equal('0.0');

    const receipt = await controller.replaceShareholder(
      1,
      benef1.address,
      benef2.address
    );
    //console.log(receipt.gasPrice?.toNumber());
    expect(ethers.utils.formatEther(await benef1.getBalance())).to.equal('0.5');
    expect(ethers.utils.formatEther(await benef2.getBalance())).to.equal('0.0');

    await _owner.sendTransaction({
      to: splitter.address,
      value: ethers.utils.parseEther('1.0')
    });

    await splitter['release(address)'](benef2.address);

    expect(ethers.utils.formatEther(await benef1.getBalance())).to.equal('0.5');
    expect(ethers.utils.formatEther(await benef2.getBalance())).to.equal('0.5');
  });

  it('supports ERC20', async function () {
    await erc20.transfer(await _user.getAddress(), 100_000);
    const benef = ethers.Wallet.createRandom().connect(controller.provider);
    const platf = ethers.Wallet.createRandom().connect(controller.provider);

    const splitter = await createSplitter(
      controller,
      [benef.address, platf.address],
      [8000, 2000],
      1,
      _owner
    );

    await erc20.connect(_user).transfer(splitter.address, 10_000);
    await _user.sendTransaction({
      to: splitter.address,
      value: ethers.utils.parseEther('1.0')
    });

    expect((await erc20.balanceOf(splitter.address)).toNumber()).to.equal(
      10_000
    );
    expect((await erc20.balanceOf(benef.address)).isZero()).to.be.true;

    await controller.withdrawAll(benef.address, [splitter.address]);
    expect((await erc20.balanceOf(benef.address)).toNumber()).to.equal(8_000);
    expect(ethers.utils.formatEther(await benef.getBalance())).to.equal('0.8');
  });

  it('doesnt create wei out of dust', async function () {
    const benef = ethers.Wallet.createRandom().connect(controller.provider);
    const platf = ethers.Wallet.createRandom().connect(controller.provider);

    const splitter = await createSplitter(
      controller,
      [benef.address, platf.address],
      [8000, 2000],
      1,
      _owner
    );
    await _user.sendTransaction({
      to: splitter.address,
      value: 1
    });

    //even though 1 wei is in, no one gets it out.
    expect(
      (await splitter.provider.getBalance(splitter.address)).toNumber()
    ).to.eq(1);

    try {
      await splitter['release(address)'](benef.address);
      expect.fail(
        'payment splitter should throw by default when nothing is to release'
      );
    } catch (e: any) {
      expect((await benef.getBalance()).toNumber()).to.eq(0);
      expect(e.message).to.contain('account is not due payment');
    }

    try {
      await splitter['release(address)'](platf.address);
      expect.fail(
        'payment splitter should throw by default when nothing is to release'
      );
    } catch (e: any) {
      expect((await platf.getBalance()).toNumber()).to.eq(0);
      expect(e.message).to.contain('account is not due payment');
    }

    //lets add more.
    await _user.sendTransaction({
      to: splitter.address,
      value: 9
    });
    expect(
      (await splitter.provider.getBalance(splitter.address)).toNumber()
    ).to.eq(10);
    await splitter['release(address)'](benef.address);
    expect((await benef.getBalance()).toNumber()).to.eq(8);
    await splitter['release(address)'](platf.address);
    expect((await platf.getBalance()).toNumber()).to.eq(2);
  });

  it('can withdraw all funds of many splitters of one shareholder', async function () {
    const benef = ethers.Wallet.createRandom().connect(controller.provider);
    const platf = ethers.Wallet.createRandom().connect(controller.provider);
    const idxs = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const splitters = await Promise.all(
      idxs.map((i) => {
        return createSplitter(
          controller,
          [benef.address, platf.address],
          [8500, 1500],
          i,
          _owner
        );
      })
    );
    const eth01 = ethers.utils.parseEther('0.1');
    const ethTransfers = await Promise.all(
      idxs.map((i) => {
        return _user.sendTransaction({
          to: splitters[i].address,
          value: eth01.mul(i + 1)
        });
      })
    );
    const someErc20 = await (
      await ethers.getContractFactory('GLDToken', _owner)
    ).deploy(1_000_000_000);

    const anotherErc20 = await (
      await ethers.getContractFactory('GLDToken', _owner)
    ).deploy(1_000_000_000);

    await Promise.all([
      idxs.map((i) => {
        (async () => {
          await erc20.transfer(splitters[i].address, 10_000 * i + 1);
          await someErc20.transfer(splitters[i].address, 100_000 * i + 1);
          await anotherErc20.transfer(splitters[i].address, 1_000_000 * i + 1);
        })();
      })
    ]);

    await controller.withdrawAll(benef.address, []);
    expect(await ethers.utils.formatEther(await benef.getBalance())).to.equal(
      '4.675'
    );
  });

  it('can withdraw funds even when one ps has been transferred', async function () {
    const benef1 = ethers.Wallet.createRandom().connect(controller.provider);
    const benef2 = ethers.Wallet.createRandom().connect(controller.provider);
    const platf = ethers.Wallet.createRandom().connect(controller.provider);

    const splitter1 = await createSplitter(
      controller,
      [benef1.address, platf.address],
      [5000, 5000],
      1,
      _owner
    );

    const splitter2 = await createSplitter(
      controller,
      [benef1.address, platf.address],
      [5000, 5000],
      2,
      _owner
    );

    await _owner.sendTransaction({
      to: splitter1.address,
      value: ethers.utils.parseEther('1.0')
    });

    await _owner.sendTransaction({
      to: splitter2.address,
      value: ethers.utils.parseEther('1.0')
    });

    await controller.replaceShareholder(1, benef1.address, benef2.address);

    expect(await ethers.utils.formatEther(await benef1.getBalance())).to.equal(
      '0.5'
    );

    //benef1 shares on ps1 are 0. This should still work:
    await controller.withdrawAll(benef1.address, []);

    //received funds of ps2
    expect(await ethers.utils.formatEther(await benef1.getBalance())).to.equal(
      '1.0'
    );
  });

  it('can be upgraded', async function () {
    const benef1 = ethers.Wallet.createRandom().connect(controller.provider);
    const benef2 = ethers.Wallet.createRandom().connect(controller.provider);
    const platf = ethers.Wallet.createRandom().connect(controller.provider);

    const splitter = await createSplitter(
      controller,
      [benef1.address, platf.address],
      [7000, 3000],
      1,
      _owner
    );

    await _owner.sendTransaction({
      to: splitter.address,
      value: ethers.utils.parseEther('1.0')
    });

    //now update the contract
    const PaymentSplitterControllerFactory = await ethers.getContractFactory(
      'TestPaymentSplitterController'
    );

    const newInstance = (await upgrades.upgradeProxy(
      controller.address,
      PaymentSplitterControllerFactory,
      {}
    )) as TestPaymentSplitterController;

    const greeting = await newInstance.greet();
    expect(greeting).to.equal('Hello, test');

    await newInstance.replaceShareholder(1, benef1.address, benef2.address);
    expect(ethers.utils.formatEther(await benef1.getBalance())).to.equal('0.7');

    expect(ethers.utils.formatEther(await benef2.getBalance())).to.equal('0.0');

    await newInstance.withdrawAll(benef2.address, []);
    expect(ethers.utils.formatEther(await benef2.getBalance())).to.equal('0.0');
  });
});

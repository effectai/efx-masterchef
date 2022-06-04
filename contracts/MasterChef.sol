pragma solidity 0.6.12;

import '@pancakeswap/pancake-swap-lib/contracts/math/SafeMath.sol';
import '@pancakeswap/pancake-swap-lib/contracts/token/BEP20/IBEP20.sol';
import '@pancakeswap/pancake-swap-lib/contracts/token/BEP20/SafeBEP20.sol';
import '@pancakeswap/pancake-swap-lib/contracts/access/Ownable.sol';

// import "@nomiclabs/buidler/console.sol";

// MasterChef for EFX liquidity. He can distribute EFX and he is a fair guy.
//
// Note that it's ownable and the owner wields tremendous power. The ownership
// will be transferred to a TimeLock.
//
// Have fun reading it. Hopefully it's bug-free. God bless.
contract MasterChef is Ownable {
    using SafeMath for uint256;
    using SafeBEP20 for IBEP20;

    // Info of each user.
    struct UserInfo {
        uint256 amount;     // How many LP tokens the user has provided.
        uint256 rewardDebt; // Reward debt. See explanation below.
        //
        // We do some fancy math here. Basically, any point in time, the amount of EFXs
        // entitled to a user but is pending to be distributed is:
        //
        //   pending reward = (user.amount * pool.accEfxPerShare) - user.rewardDebt
        //
        // Whenever a user deposits or withdraws LP tokens to a pool. Here's what happens:
        //   1. The pool's `accEfxPerShare` (and `lastRewardBlock`) gets updated.
        //   2. User receives the pending reward sent to his/her address.
        //   3. User's `amount` gets updated.
        //   4. User's `rewardDebt` gets updated.
    }

    // Info of each pool.
    struct PoolInfo {
        IBEP20 lpToken;           // Address of LP token contract.
        uint256 allocPoint;       // How many allocation points assigned to this pool.
        uint256 lastRewardBlock;  // Last block number that EFXs distribution occurs.
        uint256 accEfxPerShare;   // Accumulated EFX per share, times 1e12. See below.
    }

    // The EFX TOKEN!
    IBEP20 public efx;

    // EFX tokens distributed per block.
    uint256 public efxPerBlock;

    // Info of each pool.
    PoolInfo[] public poolInfo;
    // Info of each user that stakes LP tokens.
    mapping (uint256 => mapping (address => UserInfo)) public userInfo;
    // Total allocation points. Must be the sum of all allocation points in all pools.
    uint256 public totalAllocPoint = 0;
    // The block number when EFX distribution starts.
    uint256 public startBlock;
    // The block number when EFX distribution ends.
    uint256 public endBlock;

    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    event EmergencyWithdraw(address indexed user, uint256 amount);

    constructor(
        IBEP20 _efx,
        IBEP20 _lptoken,
        uint256 _efxPerBlock,
        uint256 _startBlock,
        uint256 _endBlock
    ) public {
        efx = _efx;
        efxPerBlock = _efxPerBlock;
        startBlock = _startBlock;
        endBlock = _endBlock;

        poolInfo.push(PoolInfo({
            lpToken: _lptoken,
            allocPoint: 1000,
            lastRewardBlock: startBlock,
            accEfxPerShare: 0
        }));

        totalAllocPoint = 1000;
    }

    // Return reward multiplier over the given _from to _to block.
    function getMultiplier(uint256 _from, uint256 _to) public view returns (uint256) {
        if (_to <= endBlock) {
            return _to.sub(_from);
        } else if (_from >= endBlock) {
            return 0;
        } else {
            return endBlock.sub(_from);
        }
    }

    // View function to see pending EFXs on frontend.
    function pendingEfx(address _user) external view returns (uint256) {
        PoolInfo storage pool = poolInfo[0];
        UserInfo storage user = userInfo[0][_user];
        uint256 accEfxPerShare = pool.accEfxPerShare;
        uint256 lpSupply = pool.lpToken.balanceOf(address(this));
        if (block.number > pool.lastRewardBlock && lpSupply != 0) {
            uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number);
            uint256 efxReward = multiplier.mul(efxPerBlock).mul(pool.allocPoint).div(totalAllocPoint);
            accEfxPerShare = accEfxPerShare.add(efxReward.mul(1e12).div(lpSupply));
        }
        return user.amount.mul(accEfxPerShare).div(1e12).sub(user.rewardDebt);
    }

    // Update reward variables of the given pool to be up-to-date.
    function updatePool(uint256 _pid) public {
        PoolInfo storage pool = poolInfo[_pid];
        if (block.number <= pool.lastRewardBlock) {
            return;
        }
        uint256 lpSupply = pool.lpToken.balanceOf(address(this));
        if (lpSupply == 0) {
            pool.lastRewardBlock = block.number;
            return;
        }
        uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number);
        uint256 efxReward = multiplier.mul(efxPerBlock).mul(pool.allocPoint).div(totalAllocPoint);
        pool.accEfxPerShare = pool.accEfxPerShare.add(efxReward.mul(1e12).div(lpSupply));
        pool.lastRewardBlock = block.number;
    }

    // Deposit LP tokens to MasterChef for EFX allocation.
    function deposit(uint256 _amount) public {
        PoolInfo storage pool = poolInfo[0];
        UserInfo storage user = userInfo[0][msg.sender];
        updatePool(0);
        if (user.amount > 0) {
            uint256 pending = user.amount.mul(pool.accEfxPerShare).div(1e12).sub(user.rewardDebt);
            if(pending > 0) {
                efx.safeTransfer(msg.sender, pending);
            }
        }
        if (_amount > 0) {
            pool.lpToken.safeTransferFrom(address(msg.sender), address(this), _amount);
            user.amount = user.amount.add(_amount);
        }
        user.rewardDebt = user.amount.mul(pool.accEfxPerShare).div(1e12);
        emit Deposit(msg.sender, _amount);
    }

    // Withdraw LP tokens from MasterChef.
    function withdraw(uint256 _amount) public {
        PoolInfo storage pool = poolInfo[0];
        UserInfo storage user = userInfo[0][msg.sender];
        require(user.amount >= _amount, "withdraw: not good");

        updatePool(0);
        uint256 pending = user.amount.mul(pool.accEfxPerShare).div(1e12).sub(user.rewardDebt);
        if(pending > 0) {
            efx.safeTransfer(address(msg.sender), pending);
        }
        if(_amount > 0) {
            user.amount = user.amount.sub(_amount);
            pool.lpToken.safeTransfer(address(msg.sender), _amount);
        }
        user.rewardDebt = user.amount.mul(pool.accEfxPerShare).div(1e12);
        emit Withdraw(msg.sender, _amount);
    }

    // Withdraw without caring about rewards. EMERGENCY ONLY.
    function emergencyWithdraw() public {
        PoolInfo storage pool = poolInfo[0];
        UserInfo storage user = userInfo[0][msg.sender];
        uint256 userAmount = user.amount;
        user.amount = 0;
        user.rewardDebt = 0;
        pool.lpToken.safeTransfer(address(msg.sender), userAmount);
        emit EmergencyWithdraw(msg.sender, userAmount);
    }

    // Withdraw reward. EMERGENCY ONLY.
    function emergencyEfxWithdraw(uint256 _amount) public onlyOwner {
        require(_amount < efx.balanceOf(address(this)), 'not enough token');
        efx.safeTransfer(address(msg.sender), _amount);
    }
}

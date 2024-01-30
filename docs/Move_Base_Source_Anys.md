---
id: SLAM_Move_Base_Source_Anys
title: move_base源码分析
---
move_base功能包是在ROS的导航中最常用的包之一。它提供了基于动作(action)的路径规划实现，可以根据给定的目标点，控制机器人底盘运动至目标位置，并且在运动过程中会连续反馈机器人自身的姿态与目标点的状态信息。move_base节点与全局规划器(Global planner)和局部规划器(Local planner)连接在一起，以完成其全局的导航任务。其运行框架如下图所示：

![](./assets/Move_Base_Source_Anys/overview_tf.png)

<center> <font font-size="14px"><font color = "#c0c0c0">图1. Overview </font></font></center> 

![](./assets/Move_Base_Source_Anys/recovery_behaviors.png)

<center> <font font-size="14px"><font color = "#c0c0c0">图2. 恢复动作 </font></font></center> 

接下来，将按照程序的执行顺序与执行逻辑分析move_base的源代码。

如果有错误，欢迎在文章最下面的Comments中指出，感谢~



### 头文件

首先声明了命名空间move_base，随后声明server端，调用了actionlib包中的类，消息类型是move_base_msgs::MoveBaseAction

```cpp title="move_base.h"
typedef actionlib::SimpleActionServer<move_base_msgs::MoveBaseAction> MoveBaseActionServer;
```

接着，声明了两个枚举类：

```cpp title="move_base.h"
//枚举movebase状态
enum MoveBaseState { 
  PLANNING,
  CONTROLLING,
  CLEARING
};

//枚举恢复触发标志位
enum RecoveryTrigger
{
  PLANNING_R,
  CONTROLLING_R,
  OSCILLATION_R
};
```

定义MoveBase类：

```cpp title="move_base.h"
class MoveBase {}
```

进入MoveBase类，先看看里面有哪些成员，简单看看都是做什么的：

1. 构造函数

```cpp title="move_base.h"
MoveBase(tf2_ros::Buffer& tf);
```

2. 析构函数

```cpp title="move_base.h"
virtual ~MoveBase();
```

3. 控制循环。传入目标点goal，如果成功到达目标点则返回True

```cpp title="move_base.h"
bool executeCycle(geometry_msgs::PoseStamped& goal);
```

4. 清除costmap函数，用于更新costmap

```cpp title="move_base.h"
bool clearCostmapsService(std_srvs::Empty::Request &req, std_srvs::Empty::Response &resp);
```

5. 当action处于非活跃状态时，调用此函数可以返回一个plan

```cpp title="move_base.h"
bool planService(nav_msgs::GetPlan::Request &req, nav_msgs::GetPlan::Response &resp);
```

6. 制作一个新的规划路径。传入参数为目标点(goal)和存储规划路径点的容器(plan)

```cpp title="move_base.h"
bool makePlan(const geometry_msgs::PoseStamped& goal, std::vector<geometry_msgs::PoseStamped>& plan);
```

7. 从参数服务器(param)加载机器人恢复动作(recovery behaviors)。当机器人受阻时，会执行此动作。

```cpp title="move_base.h"
bool loadRecoveryBehaviors(ros::NodeHandle node);
```

8. 加载默认的恢复动作

```cpp title="move_base.h"
void loadDefaultRecoveryBehaviors();
```

9. 清除一定范围内的costmap

```cpp title="move_base.h"
void clearCostmapWindows(double size_x, double size_y);
```

10. 发布速度为0的指令

```cpp title="move_base.h"
void publishZeroVelocity();
```

11. 重置move_base的状态机状态

```cpp title="move_base.h"
void resetState();
```

12. 一些回调函数。下文介绍到调用该回调函数的代码时会做介绍。

```cpp title="move_base.h"
void goalCB(const geometry_msgs::PoseStamped::ConstPtr& goal);
void executeCb(const move_base_msgs::MoveBaseGoalConstPtr& move_base_goal);
void reconfigureCB(move_base::MoveBaseConfig &config, uint32_t level);
```

13. 规划线程的入口函数

```cpp title="move_base.h"
void planThread();
```

14. 判断四元数是否合法

```cpp title="move_base.h"
bool isQuaternionValid(const geometry_msgs::Quaternion& q);
```

15. 获取机器人在全局坐标系下的位姿

```cpp title="move_base.h"
bool getRobotPose(geometry_msgs::PoseStamped& global_pose, costmap_2d::Costmap2DROS* costmap);
```

16. 获取两个点之间的欧氏距离

```cpp title="move_base.h"
double distance(const geometry_msgs::PoseStamped& p1, const geometry_msgs::PoseStamped& p2);
```

17. 将目标点转换到全局坐标系下

```cpp title="move_base.h"
geometry_msgs::PoseStamped goalToGlobalFrame(const geometry_msgs::PoseStamped& goal_pose_msg);
```

18. 唤醒规划器

```cpp title="move_base.h"
void wakePlanner(const ros::TimerEvent& event);
```

19. 数据成员

```cpp title="move_base.h"
tf2_ros::Buffer& tf_;

MoveBaseActionServer* as_; //actionlib的server端

boost::shared_ptr<nav_core::BaseLocalPlanner> tc_; //局部规划器的实例化指针
costmap_2d::Costmap2DROS* planner_costmap_ros_, *controller_costmap_ros_; //costmap相关指针

boost::shared_ptr<nav_core::BaseGlobalPlanner> planner_; //全局规划器的实例化指针
std::string robot_base_frame_, global_frame_; //坐标系定义

std::vector<boost::shared_ptr<nav_core::RecoveryBehavior> > recovery_behaviors_; 
std::vector<std::string> recovery_behavior_names_;
unsigned int recovery_index_;

geometry_msgs::PoseStamped global_pose_;
double planner_frequency_, controller_frequency_, inscribed_radius_, circumscribed_radius_;
double planner_patience_, controller_patience_;
int32_t max_planning_retries_; //最大重试规划次数
uint32_t planning_retries_;
double conservative_reset_dist_, clearing_radius_;
ros::Publisher current_goal_pub_, vel_pub_, action_goal_pub_, recovery_status_pub_;
ros::Subscriber goal_sub_;
ros::ServiceServer make_plan_srv_, clear_costmaps_srv_;
bool shutdown_costmaps_, clearing_rotation_allowed_, recovery_behavior_enabled_;
bool make_plan_clear_costmap_, make_plan_add_unreachable_goal_;
double oscillation_timeout_, oscillation_distance_;

MoveBaseState state_; //声明movebase状态
RecoveryTrigger recovery_trigger_; //声明恢复触发标志位

ros::Time last_valid_plan_, last_valid_control_, last_oscillation_reset_;
geometry_msgs::PoseStamped oscillation_pose_;
pluginlib::ClassLoader<nav_core::BaseGlobalPlanner> bgp_loader_;
pluginlib::ClassLoader<nav_core::BaseLocalPlanner> blp_loader_;
pluginlib::ClassLoader<nav_core::RecoveryBehavior> recovery_loader_;

//存储规划路径的三个容器
std::vector<geometry_msgs::PoseStamped>* planner_plan_;
std::vector<geometry_msgs::PoseStamped>* latest_plan_;
std::vector<geometry_msgs::PoseStamped>* controller_plan_;

//规划器线程
bool runPlanner_;
boost::recursive_mutex planner_mutex_;
boost::condition_variable_any planner_cond_;
geometry_msgs::PoseStamped planner_goal_;
boost::thread* planner_thread_;

//动态参数服务器线程
boost::recursive_mutex configuration_mutex_;
dynamic_reconfigure::Server<move_base::MoveBaseConfig> *dsrv_;

move_base::MoveBaseConfig last_config_;
move_base::MoveBaseConfig default_config_;
bool setup_, p_freq_change_, c_freq_change_;
bool new_global_plan_;
```

如果是第一次看move_base的源码，可能不能很好地把握头文件中声明的函数、数据成员都是什么意思。可以不用着急，等整体过了一遍之后再返回来看会豁然开朗的。



### 节点(Node)入口

```cpp title="move_base_node.cpp"
#include <move_base/move_base.h>
#include <tf2_ros/transform_listener.h>

int main(int argc, char** argv){
  ros::init(argc, argv, "move_base_node");
  tf2_ros::Buffer buffer(ros::Duration(10));
  tf2_ros::TransformListener tf(buffer);

  move_base::MoveBase move_base( buffer );

  //ros::MultiThreadedSpinner s;
  ros::spin();

  return(0);
}
```

入口文件定义了move_base::MoveBase对象move_base，传入参数为tf2_ros::Buffer。在tf2中，将包分为tf2和tf2_ros，前者用来进行坐标变换等具体操作，**tf2_ros则负责与ROS消息打交道**，负责发布tf或订阅tf，即发布者和订阅者是在tf2_ros命名空间下的。

在定义对象move_base的同时，进入了move_base的构造函数。



### 源文件

现在正式进入move_base.cpp。在cpp文件里，定义了上面介绍到的所有函数。

首先是构造函数MoveBase::MoveBase：

```cpp title="move_base.cpp"
tf_(tf),
as_(NULL),
planner_costmap_ros_(NULL), controller_costmap_ros_(NULL), //costmap的实例化指针
bgp_loader_("nav_core", "nav_core::BaseGlobalPlanner"), //加载插件
blp_loader_("nav_core", "nav_core::BaseLocalPlanner"), //加载插件
recovery_loader_("nav_core", "nav_core::RecoveryBehavior"), //加载插件
planner_plan_(NULL), latest_plan_(NULL), controller_plan_(NULL), //初始化三个储存规划路径的容器
runPlanner_(false), setup_(false), p_freq_change_(false), c_freq_change_(false), new_global_plan_(false)  //一些运行参数
```

定义并初始化了一堆参数，随后

```cpp title="move_base.cpp"
as_ = new MoveBaseActionServer(ros::NodeHandle(), "move_base", [this](auto& goal){ executeCb(goal); }, false);
```

new了一个MoveBaseActionServer，取名为move_base，该服务器的回调函数为executeCb。看看这个回调函数都做了些什么。

```cpp 
//In function executeCb(...)

if(!isQuaternionValid(move_base_goal->target_pose.pose.orientation)){
    as_->setAborted(move_base_msgs::MoveBaseResult(), "Aborting on goal because it was sent with an invalid quaternion");
    return;
}
```

首先，判断四元数是否合法。如果非法，则中止ActionServer，返回信息并退出。

判断四元数是否合法的函数如下：

```cpp title="move_base.cpp"
bool MoveBase::isQuaternionValid(const geometry_msgs::Quaternion& q){
//first we need to check if the quaternion has nan's or infs
if(!std::isfinite(q.x) || !std::isfinite(q.y) || !std::isfinite(q.z) || !std::isfinite(q.w)){
    ROS_ERROR("Quaternion has nans or infs... discarding as a navigation goal");
    return false;
}

tf2::Quaternion tf_q(q.x, q.y, q.z, q.w);

//next, we need to check if the length of the quaternion is close to zero
if(tf_q.length2() < 1e-6){
    ROS_ERROR("Quaternion has length close to zero... discarding as navigation goal");
    return false;
}

//next, we'll normalize the quaternion and check that it transforms the vertical vector correctly
tf_q.normalize();

tf2::Vector3 up(0, 0, 1);

double dot = up.dot(up.rotate(tf_q.getAxis(), tf_q.getAngle()));

if(fabs(dot - 1) > 1e-3){
    ROS_ERROR("Quaternion is invalid... for navigation the z-axis of the quaternion must be close to vertical.");
    return false;
}

return true;
}
```

回到回调函数executeCb。先将目标点的坐标转换到全局坐标系下：

```cpp
//In function executeCb(...)

geometry_msgs::PoseStamped goal = goalToGlobalFrame(move_base_goal->target_pose);
```
转换的函数如下：

```cpp
geometry_msgs::PoseStamped MoveBase::goalToGlobalFrame(const geometry_msgs::PoseStamped& goal_pose_msg){
std::string global_frame = planner_costmap_ros_->getGlobalFrameID();
geometry_msgs::PoseStamped goal_pose, global_pose;
goal_pose = goal_pose_msg;

//获取开始转换的时间戳
goal_pose.header.stamp = ros::Time();

try{
    tf_.transform(goal_pose_msg, global_pose, global_frame);
}
catch(tf2::TransformException& ex){
    ROS_WARN("Failed to transform the goal pose from %s into the %s frame: %s",
        goal_pose.header.frame_id.c_str(), global_frame.c_str(), ex.what());
    return goal_pose_msg;
}

return global_pose;
}
```

然后向机器人发布停止指令（设置底盘速度为0），准备开始规划路径：

```cpp
//In function executeCb(...)

publishZeroVelocity();
//we have a goal so start the planner
//goalToGlobalFrame中TF变换后得到目标点，唤醒路径规划线程
boost::unique_lock<boost::recursive_mutex> lock(planner_mutex_);
planner_goal_ = goal;
runPlanner_ = true;
planner_cond_.notify_one();
lock.unlock();

current_goal_pub_.publish(goal); //发布目标点goal

ros::Rate r(controller_frequency_);//给定控制频率
```

因为需要实时地根据传感器数据来规划路径，因此是时候让costmap更新了：

```cpp
//In function executeCb(...)

//开始更新costmap
if(shutdown_costmaps_){
    ROS_DEBUG_NAMED("move_base","Starting up costmaps that were shut down previously");
    planner_costmap_ros_->start(); 
    controller_costmap_ros_->start();
}
```

同时，更新一下时间标志位，方便我们后续判断是否超时了：

```cpp
//In function executeCb(...)

//更新上次执行合理的规划和控制时间标志位
last_valid_control_ = ros::Time::now();
last_valid_plan_ = ros::Time::now();
last_oscillation_reset_ = ros::Time::now();
planning_retries_ = 0;
```

声明一个节点句柄：

```cpp
//In function executeCb(...)

ros::NodeHandle n;
```

接下来开启循环：

```cpp
//In function executeCb(...)

while(n.ok()) //开启循环
{
    if(c_freq_change_) //如果控制频率修改了，需要做出反应
    {
    ROS_INFO("Setting controller frequency to %.2f", controller_frequency_);
    r = ros::Rate(controller_frequency_);
    c_freq_change_ = false;
    }

    if(as_->isPreemptRequested()){ //ActionServer得到一个抢占目标请求
        if(as_->isNewGoalAvailable()){ //如果有可用的新目标，接受新目标点，但不会关闭其他进程

            move_base_msgs::MoveBaseGoal new_goal = *as_->acceptNewGoal();

            if(!isQuaternionValid(new_goal.target_pose.pose.orientation)){ //如果目标点无效，则退出
            as_->setAborted(move_base_msgs::MoveBaseResult(), "Aborting on goal because it was sent with an invalid quaternion");
            return;
            }

            goal = goalToGlobalFrame(new_goal.target_pose); //TF变换 将目标点转换到全局坐标系下

            //确保下次循环开始时处在正常的状态，需要重置一下
            recovery_index_ = 0; 
            state_ = PLANNING; //设置状态为PLANNING

            //传入目标点的同时确保规划线程运行中
            lock.lock();
            planner_goal_ = goal;
            runPlanner_ = true;
            planner_cond_.notify_one();
            lock.unlock();

            //发布目标点到可视化界面上(?)
            ROS_DEBUG_NAMED("move_base","move_base has received a goal of x: %.2f, y: %.2f", goal.pose.position.x, goal.pose.position.y);
            current_goal_pub_.publish(goal);

            //刷新时间标志位
            last_valid_control_ = ros::Time::now();
            last_valid_plan_ = ros::Time::now();
            last_oscillation_reset_ = ros::Time::now();
            planning_retries_ = 0;
        }
        else { //如果无可用的新目标
            resetState(); //重置状态
            ROS_DEBUG_NAMED("move_base","Move base preempting the current goal");
            as_->setPreempted(); //设置为抢占
            return;
        }
    }

    //检查全局坐标系是否变更,如果变更了，重新变换目标点到新全局坐标系，和上面相似
    if(goal.header.frame_id != planner_costmap_ros_->getGlobalFrameID()){
        goal = goalToGlobalFrame(goal);

        //确保下次循环时处在正常的状态，需要设定一下状态
        recovery_index_ = 0;
        state_ = PLANNING;

        //传入目标点的同时确保规划线程运行中
        lock.lock();
        planner_goal_ = goal;
        runPlanner_ = true;
        planner_cond_.notify_one();
        lock.unlock();

        //发布目标点到可视化界面上(?)
        ROS_DEBUG_NAMED("move_base","The global frame for move_base has changed, new frame: %s, new goal position x: %.2f, y: %.2f", goal.header.frame_id.c_str(), goal.pose.position.x, goal.pose.position.y);
        current_goal_pub_.publish(goal);

        //刷新时间标志位
        last_valid_control_ = ros::Time::now();
        last_valid_plan_ = ros::Time::now();
        last_oscillation_reset_ = ros::Time::now();
        planning_retries_ = 0;
    }

    //记录开始时间
    ros::WallTime start = ros::WallTime::now();

    //执行机器人的路径跟踪
    bool done = executeCycle(goal);

    //如果执行完毕，则退出当前的while(n.ok())循环
    if(done)
        return;

	//计算一下控制循环的耗时并记录
    ros::WallDuration t_diff = ros::WallTime::now() - start;
    ROS_DEBUG_NAMED("move_base","Full control cycle time: %.9f\n", t_diff.toSec());

    r.sleep(); //在当前控制周期的剩余控制时间中休眠

    //如果超过了控制周期，则输出警告信息
    if(r.cycleTime() > ros::Duration(1 / controller_frequency_) && state_ == CONTROLLING)
    ROS_WARN("Control loop missed its desired rate of %.4fHz... the loop actually took %.4f seconds", controller_frequency_, r.cycleTime().toSec());
} //while结束
```

其中，执行机器人路径跟踪的函数为MoveBase::executeCycle()，如下：

```cpp
bool MoveBase::executeCycle(geometry_msgs::PoseStamped& goal){
    
    boost::recursive_mutex::scoped_lock ecl(configuration_mutex_); 
    geometry_msgs::Twist cmd_vel; //定义发送机器人速度的变量

    //获取机器人当前位置
    geometry_msgs::PoseStamped global_pose;
    getRobotPose(global_pose, planner_costmap_ros_);
    const geometry_msgs::PoseStamped& current_position = global_pose;

    //将当前位置传给feedback，输出feedback
    move_base_msgs::MoveBaseFeedback feedback;
    feedback.base_position = current_position;
    as_->publishFeedback(feedback);
```

其中，获取机器人位置的函数getRobotPose()具体为：

```cpp
bool MoveBase::getRobotPose(geometry_msgs::PoseStamped& global_pose, costmap_2d::Costmap2DROS* costmap)
{
    tf2::toMsg(tf2::Transform::getIdentity(), global_pose.pose);
    geometry_msgs::PoseStamped robot_pose;
    tf2::toMsg(tf2::Transform::getIdentity(), robot_pose.pose);
    robot_pose.header.frame_id = robot_base_frame_;
    robot_pose.header.stamp = ros::Time(); // latest available
    ros::Time current_time = ros::Time::now();  // save time for checking tf delay later

    // get robot pose on the given costmap frame
    try
    {
        tf_.transform(robot_pose, global_pose, costmap->getGlobalFrameID()); //将机器人位姿转换到全局坐标系下
    }
    catch (tf2::LookupException& ex)
    {
        ROS_ERROR_THROTTLE(1.0, "No Transform available Error looking up robot pose: %s\n", ex.what());
        return false;
    }
    catch (tf2::ConnectivityException& ex)
    {
        ROS_ERROR_THROTTLE(1.0, "Connectivity Error looking up robot pose: %s\n", ex.what());
        return false;
    }
    catch (tf2::ExtrapolationException& ex)
    {
        ROS_ERROR_THROTTLE(1.0, "Extrapolation Error looking up robot pose: %s\n", ex.what());
        return false;
    }

    // 检查通过转换得到的全局位姿的时间戳是否在costmap的要求内（TF tolerance)
    // 确保实时性。如果转换时间过长，机器人得到的全局位姿是过时的
    if (!global_pose.header.stamp.isZero() &&
        current_time.toSec() - global_pose.header.stamp.toSec() > costmap->getTransformTolerance())
    {
        ROS_WARN_THROTTLE(1.0, "Transform timeout for %s. " \
                        "Current time: %.4f, pose stamp: %.4f, tolerance: %.4f", costmap->getName().c_str(),
                        current_time.toSec(), global_pose.header.stamp.toSec(), costmap->getTransformTolerance());
        return false;
    }

    return true;
}
```

回到执行机器人路径跟踪的函数executeCycle()中，检测震荡情况和地图的实时性

```cpp
//In function executeCycle(...)

//distance函数返回的是两个位置的直线距离（欧氏距离）
    if(distance(current_position, oscillation_pose_) >= oscillation_distance_) 
    {
        // 更新振荡位置的时间标志位、位置
        last_oscillation_reset_ = ros::Time::now();
        oscillation_pose_ = current_position;

        //如果上次的恢复动作是因为位置振荡导致的，则重置恢复序列
        if(recovery_trigger_ == OSCILLATION_R)
        recovery_index_ = 0; //PLANNING_R
    }

    //检查地图数据的实时性，如果过时了，设置机器人速度为0并发送出去
    if(!controller_costmap_ros_->isCurrent()){
        ROS_WARN("[%s]:Sensor data is out of date, we're not going to allow commanding of the base for safety",ros::this_node::getName().c_str());
        publishZeroVelocity();
        return false;
    }
```

如果前面都正常，此时若得到了一个新的全局规划路径，则：

```cpp
//In function executeCycle(...)

	if(new_global_plan_){
    //确保该判断仅会在刚得到新路径时实行
    new_global_plan_ = false;

    ROS_DEBUG_NAMED("move_base","Got a new plan...swap pointers");

    //do a pointer swap under mutex
    std::vector<geometry_msgs::PoseStamped>* temp_plan = controller_plan_;

    boost::unique_lock<boost::recursive_mutex> lock(planner_mutex_);
    controller_plan_ = latest_plan_;
    latest_plan_ = temp_plan;
    lock.unlock();
    ROS_DEBUG_NAMED("move_base","pointers swapped!");

    //传递路径到控制器，tc是局部规划器的指针，setPlan是TrajectoryPlannerROS的函数
    if(!tc_->setPlan(*controller_plan_)){ 
        //ABORT and SHUTDOWN COSTMAPS
        ROS_ERROR("Failed to pass global plan to the controller, aborting.");
        resetState();

        //disable the planner thread
        lock.lock();
        runPlanner_ = false;
        lock.unlock();

        as_->setAborted(move_base_msgs::MoveBaseResult(), "Failed to pass global plan to the controller.");
        return true;
    }

    //若此全局路径有效，则不需要恢复动作
    if(recovery_trigger_ == PLANNING_R)
        recovery_index_ = 0;
    }
```

接着是前面出现过很多次的state_，是一个状态机变量，用switch判断状态并执行响应的动作：

```cpp
//In function executeCycle(...)

	switch(state_)
    {
        case PLANNING:
        case CONTROLLING:
        case CLEARING:
        default:
            
    }
```

一般来说，默认或者得到一个goal时的状态是PLANNING，规划得到路径后会转变为CONTROLLING。如果规划失败或者控制失败，会转变为CLEARING状态。当然，规划失败也会进入CLEARING状态。

首先看一下PLANNING状态都做了什么：

```cpp
//In function executeCycle(...)

	//1. 规划状态，则尝试获取一条全局路径
    case PLANNING:
    {
        boost::recursive_mutex::scoped_lock lock(planner_mutex_);
        runPlanner_ = true; //唤醒规划线程
        planner_cond_.notify_one();
    }
    ROS_DEBUG_NAMED("move_base","Waiting for plan, in the planning state.");
    break;
```

然后是CONTROLLING状态：

```cpp
//In function executeCycle(...)

	//2. 控制状态
    case CONTROLLING:
    ROS_DEBUG_NAMED("move_base","In controlling state.");

    //如果到达目标，则重置状态，发送成功信息
    if(tc_->isGoalReached()){
        ROS_DEBUG_NAMED("move_base","Goal reached!");
        resetState();

        //disable the planner thread
        boost::unique_lock<boost::recursive_mutex> lock(planner_mutex_);
        runPlanner_ = false;
        lock.unlock();

        as_->setSucceeded(move_base_msgs::MoveBaseResult(), "Goal reached.");
        return true;
    }

    //检测到振荡状态
    if(oscillation_timeout_ > 0.0 &&
        last_oscillation_reset_ + ros::Duration(oscillation_timeout_) < ros::Time::now())
    {
        //使机器人停下，设置清除障碍的状态标志位
        publishZeroVelocity();
        state_ = CLEARING;
        recovery_trigger_ = OSCILLATION_R;
    }

    {
        boost::unique_lock<costmap_2d::Costmap2D::mutex_t> lock(*(controller_costmap_ros_->getCostmap()->getMutex()));

    //获取有效的速度，成功则直接发送到cmd_vel
    if(tc_->computeVelocityCommands(cmd_vel)){
        ROS_DEBUG_NAMED( "move_base", "Got a valid command from the local planner: %.3lf, %.3lf, %.3lf",
                        cmd_vel.linear.x, cmd_vel.linear.y, cmd_vel.angular.z );
        last_valid_control_ = ros::Time::now();
        //make sure that we send the velocity command to the base
        vel_pub_.publish(cmd_vel);
        if(recovery_trigger_ == CONTROLLING_R)
        recovery_index_ = 0;
    }
    else { 
        ROS_DEBUG_NAMED("move_base", "The local planner could not find a valid plan.");
        ros::Time attempt_end = last_valid_control_ + ros::Duration(controller_patience_);

        //检查是否超时
        if(ros::Time::now() > attempt_end){
        //如果没有得到有效速度，判断如果超过了尝试时间，则发送0速度，进入清除障碍模式
            publishZeroVelocity();
            state_ = CLEARING;
            recovery_trigger_ = CONTROLLING_R;
        }
        else{
        //如果没有超时，则再尝试规划一个路线
        last_valid_plan_ = ros::Time::now();
        planning_retries_ = 0;
        state_ = PLANNING;
        publishZeroVelocity();

        //开启规划线程
        boost::unique_lock<boost::recursive_mutex> lock(planner_mutex_);
        runPlanner_ = true;
        planner_cond_.notify_one();
        lock.unlock();
        }
    }
    }

    break;
```

其中，resetState()函数用于复位move_base的执行状态到规划(PLANNING)之前，确保能正常进入路径规划：

```cpp
void MoveBase::resetState(){
    // 失能规划线程
    boost::unique_lock<boost::recursive_mutex> lock(planner_mutex_);
    runPlanner_ = false;
    lock.unlock();

    // 重置状态机
    state_ = PLANNING;
    recovery_index_ = 0;
    recovery_trigger_ = PLANNING_R;
    publishZeroVelocity();

    //if we shutdown our costmaps when we're deactivated... we'll do that now
    if(shutdown_costmaps_){
        ROS_DEBUG_NAMED("move_base","Stopping costmaps");
        planner_costmap_ros_->stop();
        controller_costmap_ros_->stop();
}
}
```

还有CLEARING状态：

```cpp
//In function executeCycle(...)

	//3. 清除障碍状态。当机器人遇到规划失败、控制失败，会进入清除障碍模式
    case CLEARING:
        ROS_DEBUG_NAMED("move_base","In clearing/recovery state");

        if(recovery_behavior_enabled_ && recovery_index_ < recovery_behaviors_.size()){
        //如果有可用的动作恢复器，执行，并设定为规划状态
        //runBehavior（） 函数为move_slow_and_clear包里面的函数。
        ROS_DEBUG_NAMED("move_base_recovery","Executing behavior %u of %zu", recovery_index_+1, recovery_behaviors_.size());

        move_base_msgs::RecoveryStatus msg;
        msg.pose_stamped = current_position;
        msg.current_recovery_number = recovery_index_;
        msg.total_number_of_recoveries = recovery_behaviors_.size();
        msg.recovery_behavior_name =  recovery_behavior_names_[recovery_index_];

        recovery_status_pub_.publish(msg);

        recovery_behaviors_[recovery_index_]->runBehavior();

        //因为执行了恢复动作，记录一下震荡复位时间
        last_oscillation_reset_ = ros::Time::now();

        //设定为规划状态，再尝试规划新路径
        ROS_DEBUG_NAMED("move_base_recovery","Going back to planning state");
        last_valid_plan_ = ros::Time::now();
        planning_retries_ = 0;
        state_ = PLANNING;

        //update the index of the next recovery behavior that we'll try
        recovery_index_++;
        }
        else{
        //如果没有可用的恢复动作，结束线程，重置状态
        ROS_DEBUG_NAMED("move_base_recovery","All recovery behaviors have failed, locking the planner and disabling it.");

        boost::unique_lock<boost::recursive_mutex> lock(planner_mutex_);
        runPlanner_ = false;
        lock.unlock();

        ROS_DEBUG_NAMED("move_base_recovery","Something should abort after this.");

        if(recovery_trigger_ == CONTROLLING_R){
            ROS_ERROR("Aborting because a valid control could not be found. Even after executing all recovery behaviors");
            as_->setAborted(move_base_msgs::MoveBaseResult(), "Failed to find a valid control. Even after executing recovery behaviors.");
        }
        else if(recovery_trigger_ == PLANNING_R){
            ROS_ERROR("Aborting because a valid plan could not be found. Even after executing all recovery behaviors");
            as_->setAborted(move_base_msgs::MoveBaseResult(), "Failed to find a valid plan. Even after executing recovery behaviors.");
        }
        else if(recovery_trigger_ == OSCILLATION_R){
            ROS_ERROR("Aborting because the robot appears to be oscillating over and over. Even after executing all recovery behaviors");
            as_->setAborted(move_base_msgs::MoveBaseResult(), "Robot is oscillating. Even after executing recovery behaviors.");
        }
        resetState();
        return true;
        }
        break;
```

一般来说，switch都会加上一个default以应付奇怪的情况：

```cpp
//In function executeCycle(...)

	default:
    //默认不会进入该状态，如果进入了则说明出问题了，重置状态，结束线程
    ROS_ERROR("This case should never be reached, something is wrong, aborting");
    resetState();
    //disable the planner thread
    boost::unique_lock<boost::recursive_mutex> lock(planner_mutex_);
    runPlanner_ = false;
    lock.unlock();
    as_->setAborted(move_base_msgs::MoveBaseResult(), "Reached a case that should not be hit in move_base. This is a bug, please report it.");
    return true;
}

//we aren't done yet
return false;
} //executeCycle END
```

至此，executeCycle()回调函数结束。还记得我们是从哪里进入的吗？

```cpp title="move_base.cpp"
as_ = new MoveBaseActionServer(ros::NodeHandle(), "move_base", [this](auto& goal){ executeCb(goal); }, false);
```

回到构造函数MoveBase::MoveBase中，继续往下看：

```cpp title="move_base.cpp"
ros::NodeHandle private_nh("~");
ros::NodeHandle nh;

recovery_trigger_ = PLANNING_R; //三种触发模式，初始化为规划中触发

//加载参数，从参数服务器获取一些参数，包括两个规划器名称、代价地图坐标系、规划频率、控制周期等
std::string global_planner, local_planner;
private_nh.param("base_global_planner", global_planner, std::string("navfn/NavfnROS"));
private_nh.param("base_local_planner", local_planner, std::string("base_local_planner/TrajectoryPlannerROS"));
private_nh.param("global_costmap/robot_base_frame", robot_base_frame_, std::string("base_link"));
private_nh.param("global_costmap/global_frame", global_frame_, std::string("map"));
private_nh.param("planner_frequency", planner_frequency_, 0.0);
private_nh.param("controller_frequency", controller_frequency_, 20.0);
private_nh.param("planner_patience", planner_patience_, 5.0);
private_nh.param("controller_patience", controller_patience_, 15.0);
private_nh.param("max_planning_retries", max_planning_retries_, -1);  // disabled by default

private_nh.param("oscillation_timeout", oscillation_timeout_, 0.0);
private_nh.param("oscillation_distance", oscillation_distance_, 0.5);

// parameters of make_plan service
private_nh.param("make_plan_clear_costmap", make_plan_clear_costmap_, true);
private_nh.param("make_plan_add_unreachable_goal", make_plan_add_unreachable_goal_, true);

//planner_plan_保存最新规划的路径，传递给latest_plan_，然后latest_plan_通过executeCycle中传给controller_plan_
planner_plan_ = new std::vector<geometry_msgs::PoseStamped>();
latest_plan_ = new std::vector<geometry_msgs::PoseStamped>();
controller_plan_ = new std::vector<geometry_msgs::PoseStamped>();

//设置规划器线程，是boost::thread*类型的指针,入口函数是planThread()
planner_thread_ = new boost::thread(boost::bind(&MoveBase::planThread, this));
```

这里有一个入口函数，程序执行到这里的时候会跳到planThread()函数中，看看里面都是什么：

```cpp title="move_base.cpp"
void MoveBase::planThread(){
    ROS_DEBUG_NAMED("move_base_plan_thread","Starting planner thread...");
    ros::NodeHandle n;
    ros::Timer timer;
    bool wait_for_wake = false;
    boost::unique_lock<boost::recursive_mutex> lock(planner_mutex_); //创建一个递归的互斥量
    while(n.ok()){
        while(wait_for_wake || !runPlanner_){
            //没有使能规划线程时，阻塞该线程
            //当前线程会一直被阻塞，直到另外一个线程在相同的 std::condition_variable 对象上调用了 notification 函数来唤醒当前线程。
            ROS_DEBUG_NAMED("move_base_plan_thread","Planner thread is suspending");
            planner_cond_.wait(lock);
            wait_for_wake = false;
        }
        //外部使能了该线程，记录开始时间
        ros::Time start_time = ros::Time::now();

        //time to plan! get a copy of the goal and unlock the mutex
        geometry_msgs::PoseStamped temp_goal = planner_goal_;
        lock.unlock();
        ROS_DEBUG_NAMED("move_base_plan_thread","Planning...");

        //执行规划器
        planner_plan_->clear(); //清空
        bool gotPlan = n.ok() && makePlan(temp_goal, *planner_plan_); //获取机器人的当前位姿，调用全局规划器的makeplan得到规划路径，存储在planner_plan_

        if(gotPlan){
        ROS_DEBUG_NAMED("move_base_plan_thread","Got Plan with %zu points!", planner_plan_->size());
        //pointer swap the plans under mutex (the controller will pull from latest_plan_)
        std::vector<geometry_msgs::PoseStamped>* temp_plan = planner_plan_;

        lock.lock();
        planner_plan_ = latest_plan_; //如果得到了plan，将其传给latest_plan_
        latest_plan_ = temp_plan;
        last_valid_plan_ = ros::Time::now();
        planning_retries_ = 0;
        new_global_plan_ = true;

        ROS_DEBUG_NAMED("move_base_plan_thread","Generated a plan from the base_global_planner");

        //确保我们仅在仍未达到目标时才启动控制器
        if(runPlanner_)
            state_ = CONTROLLING;
        if(planner_frequency_ <= 0) //控制频率不可能为负
            runPlanner_ = false;
        lock.unlock();
        }
        //如果没有得到plan
        else if(state_==PLANNING){
            //且处于规划状态
            ROS_DEBUG_NAMED("move_base_plan_thread","No Plan...");
            ros::Time attempt_end = last_valid_plan_ + ros::Duration(planner_patience_);

            //check if we've tried to make a plan for over our time limit or our maximum number of retries
            //issue #496: we stop planning when one of the conditions is true, but if max_planning_retries_
            //is negative (the default), it is just ignored and we have the same behavior as ever
            //判断是否超过最大规划周期或者规划重试次数
            lock.lock();
            planning_retries_++;
            if(runPlanner_ &&
                (ros::Time::now() > attempt_end || planning_retries_ > uint32_t(max_planning_retries_))){
                //we'll move into our obstacle clearing mode
                //如果是，则进入障碍清除模式，失能规划线程
                state_ = CLEARING;
                runPlanner_ = false;  // proper solution for issue #523
                publishZeroVelocity();
                recovery_trigger_ = PLANNING_R;
            }

            lock.unlock();
        }

        //take the mutex for the next iteration
        lock.lock();

        //setup sleep interface if needed
        //如果执行完了还没到下个控制周期，则进入睡眠，经过0s（此处设置的Duration(0.0)）允许被唤醒
        if(planner_frequency_ > 0){
        ros::Duration sleep_time = (start_time + ros::Duration(1.0/planner_frequency_)) - ros::Time::now();
        if (sleep_time > ros::Duration(0.0)){
            wait_for_wake = true;
            timer = n.createTimer(sleep_time, &MoveBase::wakePlanner, this);
        }
        }
    }
}
```

这里有一个wakePlanner()，是用于唤醒路径规划线程的函数：

```cpp title="move_base.cpp"
void MoveBase::wakePlanner(const ros::TimerEvent& event)
{
// we have slept long enough for rate
planner_cond_.notify_one();
}
```

planThread()函数讲完了，回到构造函数中：

```cpp title="move_base.cpp"
//创建发布者，话题名分别为cmd_vel, current_goal, goal和recovery_status
vel_pub_ = nh.advertise<geometry_msgs::Twist>("cmd_vel", 1);
current_goal_pub_ = private_nh.advertise<geometry_msgs::PoseStamped>("current_goal", 0 );

ros::NodeHandle action_nh("move_base");
action_goal_pub_ = action_nh.advertise<move_base_msgs::MoveBaseActionGoal>("goal", 1);
recovery_status_pub_= action_nh.advertise<move_base_msgs::RecoveryStatus>("recovery_status", 1);

//we'll provide a mechanism for some people to send goals as PoseStamped messages over a topic
//they won't get any useful information back about its status, but this is useful for tools
//like nav_view and rviz
//提供消息类型为geometry_msgs::PoseStamped的发送goals的接口，比如cb为MoveBase::goalCB，在rviz中输入的目标点就是通过这个函数来响应的：
ros::NodeHandle simple_nh("move_base_simple");
goal_sub_ = simple_nh.subscribe<geometry_msgs::PoseStamped>("goal", 1, [this](auto& goal){ goalCB(goal); });
```

这里有一个入口函数，goalCB()。传入goal，将geometry_msgs::PoseStamped形式的goal转换成move_base_msgs::MoveBaseActionGoal，再发布到对应类型的goal话题中：

```cpp
void MoveBase::goalCB(const geometry_msgs::PoseStamped::ConstPtr& goal){
    ROS_DEBUG_NAMED("move_base","In ROS goal callback, wrapping the PoseStamped in the action message and re-sending to the server.");
    move_base_msgs::MoveBaseActionGoal action_goal;
    action_goal.header.stamp = ros::Time::now();
    action_goal.goal.target_pose = *goal;

    action_goal_pub_.publish(action_goal);
}
```

回到构造函数中，设置一下costmap的参数：

```cpp title="move_base.cpp"
//设置costmap参数
private_nh.param("local_costmap/inscribed_radius", inscribed_radius_, 0.325);
private_nh.param("local_costmap/circumscribed_radius", circumscribed_radius_, 0.46);
private_nh.param("clearing_radius", clearing_radius_, circumscribed_radius_);
private_nh.param("conservative_reset_dist", conservative_reset_dist_, 3.0);

private_nh.param("shutdown_costmaps", shutdown_costmaps_, false);
private_nh.param("clearing_rotation_allowed", clearing_rotation_allowed_, true);
private_nh.param("recovery_behavior_enabled", recovery_behavior_enabled_, true);
```

设置局部和全局的路径规划器：

```cpp title="move_base.cpp"
//实例化指针
planner_costmap_ros_ = new costmap_2d::Costmap2DROS("global_costmap", tf_);
planner_costmap_ros_->pause();

//初始化全局路径规划器
try {
    planner_ = bgp_loader_.createInstance(global_planner);
    planner_->initialize(bgp_loader_.getName(global_planner), planner_costmap_ros_);
} catch (const pluginlib::PluginlibException& ex) {
    ROS_FATAL("Failed to create the %s planner, are you sure it is properly registered and that the containing library is built? Exception: %s", global_planner.c_str(), ex.what());
    exit(1);
}

//实例化指针
controller_costmap_ros_ = new costmap_2d::Costmap2DROS("local_costmap", tf_);
controller_costmap_ros_->pause();

//初始化局部路径规划器
try {
    tc_ = blp_loader_.createInstance(local_planner);
    ROS_INFO("Created local_planner %s", local_planner.c_str());
    tc_->initialize(blp_loader_.getName(local_planner), &tf_, controller_costmap_ros_);
} catch (const pluginlib::PluginlibException& ex) {
    ROS_FATAL("Failed to create the %s planner, are you sure it is properly registered and that the containing library is built? Exception: %s", local_planner.c_str(), ex.what());
    exit(1);
}
```

tc_是局部路径规划器的实例化指针，在讲头文件的数据成员时提到过。

既然要做路径规划，那么肯定要根据实时情况（传感器数据）来更新地图：

```cpp title="move_base.cpp"
//开始根据传感器数据，更新costmap
planner_costmap_ros_->start();
controller_costmap_ros_->start();

//全局规划
make_plan_srv_ = private_nh.advertiseService("make_plan", &MoveBase::planService, this);

//清除一次costmap
clear_costmaps_srv_ = private_nh.advertiseService("clear_costmaps", &MoveBase::clearCostmapsService, this);

//结束更新costmap
if(shutdown_costmaps_){
    ROS_DEBUG_NAMED("move_base","Stopping costmaps initially");
    planner_costmap_ros_->stop();
    controller_costmap_ros_->stop();
}
```

其中，在定义全局规划成员make_plan_srv_时，有一个入口函数planService()，是一个全局规划器的执行策略函数：

```cpp title="move_base.cpp"
bool MoveBase::planService(nav_msgs::GetPlan::Request &req, nav_msgs::GetPlan::Response &resp){
    if(as_->isActive()){
        ROS_ERROR("move_base must be in an inactive state to make a plan for an external user");
        return false;
    }
    //确保存在一个costmap可以让我们用于规划
    if(planner_costmap_ros_ == NULL){
        ROS_ERROR("move_base cannot make a plan for you because it doesn't have a costmap");
        return false;
    }

    geometry_msgs::PoseStamped start;
    //获取起始点，如果没有起始点，那就获取当前的全局位置为起始点：
    if(req.start.header.frame_id.empty())
    {
        geometry_msgs::PoseStamped global_pose;
        if(!getRobotPose(global_pose, planner_costmap_ros_)){
            ROS_ERROR("move_base cannot make a plan for you because it could not get the start pose of the robot");
            return false;
        }
        start = global_pose;
    }
    else
    {
        start = req.start;
    }//In function executeCycle(...)


    if (make_plan_clear_costmap_) {
        //按照设定的更新范围进行costmap的更新
        clearCostmapWindows(2 * clearing_radius_, 2 * clearing_radius_);
    }
```

制定路径规划策略如下：

```cpp
//In function planService(...)

	std::vector<geometry_msgs::PoseStamped> global_plan;
    if(!planner_->makePlan(start, req.goal, global_plan) || global_plan.empty()){
      ROS_DEBUG_NAMED("move_base","Failed to find a plan to exact goal of (%.2f, %.2f), searching for a feasible goal within tolerance",
          req.goal.pose.position.x, req.goal.pose.position.y);

      //在规定的公差范围内向外寻找可行的goal
      geometry_msgs::PoseStamped p;
      p = req.goal;
      bool found_legal = false;
      float resolution = planner_costmap_ros_->getCostmap()->getResolution();
      float search_increment = resolution*3.0; //将分辨率乘以3倍，以此为增量向外寻找路径
      if(req.tolerance > 0.0 && req.tolerance < search_increment) search_increment = req.tolerance;
      for(float max_offset = search_increment; max_offset <= req.tolerance && !found_legal; max_offset += search_increment) {
        for(float y_offset = 0; y_offset <= max_offset && !found_legal; y_offset += search_increment) {
          for(float x_offset = 0; x_offset <= max_offset && !found_legal; x_offset += search_increment) {

            //不找离本位置太近的点
            if(x_offset < max_offset-1e-9 && y_offset < max_offset-1e-9) continue;

            //从X，Y两个方向找
            for(float y_mult = -1.0; y_mult <= 1.0 + 1e-9 && !found_legal; y_mult += 2.0) {

              //如果偏移量过小，则抛弃
              if(y_offset < 1e-9 && y_mult < -1.0 + 1e-9) continue;

              for(float x_mult = -1.0; x_mult <= 1.0 + 1e-9 && !found_legal; x_mult += 2.0) {
                if(x_offset < 1e-9 && x_mult < -1.0 + 1e-9) continue;

                p.pose.position.y = req.goal.pose.position.y + y_offset * y_mult;
                p.pose.position.x = req.goal.pose.position.x + x_offset * x_mult;

                if(planner_->makePlan(start, p, global_plan)){
                  if(!global_plan.empty()){

                    if (make_plan_add_unreachable_goal_) {
                      global_plan.push_back(req.goal);
                    }

                    found_legal = true;
                    ROS_DEBUG_NAMED("move_base", "Found a plan to point (%.2f, %.2f)", p.pose.position.x, p.pose.position.y);
                    break;
                  }
                }
                else{
                  ROS_DEBUG_NAMED("move_base","Failed to find a plan to point (%.2f, %.2f)", p.pose.position.x, p.pose.position.y);
                }
              }
            }
          }
        }
      }
    }
```

最后将规划好的路径传给resp然后传出去：

```cpp
//In function planService(...)

	resp.plan.poses.resize(global_plan.size());
    for(unsigned int i = 0; i < global_plan.size(); ++i){
      resp.plan.poses[i] = global_plan[i];
    }

    return true;
}
```

回到构造函数，定义clear_costmaps_srv_时，有一个入口函数clearCostmapsService()：

```cpp title="move_base.cpp"
bool MoveBase::clearCostmapsService(std_srvs::Empty::Request &req, std_srvs::Empty::Response &resp){
    //clear the costmaps
    boost::unique_lock<costmap_2d::Costmap2D::mutex_t> lock_controller(*(controller_costmap_ros_->getCostmap()->getMutex()));
    controller_costmap_ros_->resetLayers(); ///调用外部包，该函数的功能是重置地图，内部包括重置总地图、重置地图各层

    boost::unique_lock<costmap_2d::Costmap2D::mutex_t> lock_planner(*(planner_costmap_ros_->getCostmap()->getMutex()));
    planner_costmap_ros_->resetLayers();
    return true;
}
```

针对不同的reset函数，功能如下： 

对于静态层，在reset函数中，会调用onInitialize函数重新进行初始化，但基本不进行特别的操作，只是将地图更新标志位设为true，从而引起边界的更新（最大地图边界），从而导致后面更新地图时更新整个地图：

```cpp title="static_layer.cpp"
void StaticLayer::reset()
{
  if (first_map_only_)
  {
    has_updated_data_ = true;
  }
  else
  {
    onInitialize();
  }
}
```

对于障碍物层，在reset函数中，会先取消订阅传感器话题，然后复位地图，然后在重新订阅传感器话题，从而保证整个层从新开始：

```cpp title="obstacle_layer.cpp"
void ObstacleLayer::reset()
{
    deactivate();
    resetMaps();
    current_ = true;
    activate();
}
```

回到构造函数，加载动作恢复器：

```cpp title="move_base.cpp"
//加载指定的恢复器，为空则使用默认的
if(!loadRecoveryBehaviors(private_nh)){
    loadDefaultRecoveryBehaviors();
}
```

最后：

```cpp title="move_base.cpp"
//初始化move_base状态机的状态
state_ = PLANNING;

//让动作恢复器从头开始执行
recovery_index_ = 0;

//开启move_base的动作执行器
as_->start();

//启动动态参数服务器
dsrv_ = new dynamic_reconfigure::Server<move_base::MoveBaseConfig>(ros::NodeHandle("~"));
dynamic_reconfigure::Server<move_base::MoveBaseConfig>::CallbackType cb = [this](auto& config, auto level){ reconfigureCB(config, level); };
dsrv_->setCallback(cb);
}
```

这里定义了一个动态参数服务器，他的回调函数reconfigureCB()如下：

```cpp title="move_base.cpp"
void MoveBase::reconfigureCB(move_base::MoveBaseConfig &config, uint32_t level){
    boost::recursive_mutex::scoped_lock l(configuration_mutex_);
    
    //第一次调用该函数时，确保所有的配置都是原始配置
    if(!setup_)
    {
        last_config_ = config;
        default_config_ = config;
        setup_ = true;
        return;
    }

    if(config.restore_defaults) {
        config = default_config_;
        //if someone sets restore defaults on the parameter server, prevent looping
        config.restore_defaults = false;
    }

    if(planner_frequency_ != config.planner_frequency)
    {
        planner_frequency_ = config.planner_frequency;
        p_freq_change_ = true;
    }

    if(controller_frequency_ != config.controller_frequency)
    {
        controller_frequency_ = config.controller_frequency;
        c_freq_change_ = true;
    }

    planner_patience_ = config.planner_patience;
    controller_patience_ = config.controller_patience;
    max_planning_retries_ = config.max_planning_retries;
    conservative_reset_dist_ = config.conservative_reset_dist;

    recovery_behavior_enabled_ = config.recovery_behavior_enabled;
    clearing_rotation_allowed_ = config.clearing_rotation_allowed;
    shutdown_costmaps_ = config.shutdown_costmaps;

    oscillation_timeout_ = config.oscillation_timeout;
    oscillation_distance_ = config.oscillation_distance;
    //如果全局路径规划器的参数被修改了，则
    if(config.base_global_planner != last_config_.base_global_planner) {
        boost::shared_ptr<nav_core::BaseGlobalPlanner> old_planner = planner_;
        //初始化全局路径规划器
        ROS_INFO("Loading global planner %s", config.base_global_planner.c_str());
        try {
        planner_ = bgp_loader_.createInstance(config.base_global_planner);

        //等待规划结束
        boost::unique_lock<boost::recursive_mutex> lock(planner_mutex_);
            
        //在开始规划新路径前，清除旧路径
        planner_plan_->clear();
        latest_plan_->clear();
        controller_plan_->clear();
        resetState();
        planner_->initialize(bgp_loader_.getName(config.base_global_planner), planner_costmap_ros_);

        lock.unlock();
        } catch (const pluginlib::PluginlibException& ex) {
        ROS_FATAL("Failed to create the %s planner, are you sure it is properly registered and that the \
                    containing library is built? Exception: %s", config.base_global_planner.c_str(), ex.what());
        planner_ = old_planner;
        config.base_global_planner = last_config_.base_global_planner;
        }
    }
    //如果局部路径规划器的参数被修改了，则
    if(config.base_local_planner != last_config_.base_local_planner){
        boost::shared_ptr<nav_core::BaseLocalPlanner> old_planner = tc_;
        //创建一个局部规划器实例
        try {
        tc_ = blp_loader_.createInstance(config.base_local_planner);
        // Clean up before initializing the new planner
        planner_plan_->clear();
        latest_plan_->clear();
        controller_plan_->clear();
        resetState();
        tc_->initialize(blp_loader_.getName(config.base_local_planner), &tf_, controller_costmap_ros_);
        } catch (const pluginlib::PluginlibException& ex) {
        ROS_FATAL("Failed to create the %s planner, are you sure it is properly registered and that the \
                    containing library is built? Exception: %s", config.base_local_planner.c_str(), ex.what());
        tc_ = old_planner;
        config.base_local_planner = last_config_.base_local_planner;
        }
    }

    make_plan_clear_costmap_ = config.make_plan_clear_costmap;
    make_plan_add_unreachable_goal_ = config.make_plan_add_unreachable_goal;

    last_config_ = config;
}
```

构造函数MoveBase::MoveBase()结束。来到最后的析构函数MoveBase::~MoveBase()：

```cpp title="move_base.cpp"
MoveBase::~MoveBase(){
    //析构函数，释放内存
    recovery_behaviors_.clear();

    delete dsrv_;

    if(as_ != NULL)
        delete as_;

    if(planner_costmap_ros_ != NULL)
        delete planner_costmap_ros_;

    if(controller_costmap_ros_ != NULL)
        delete controller_costmap_ros_;

    planner_thread_->interrupt();
    planner_thread_->join();

    delete planner_thread_;

    delete planner_plan_;
    delete latest_plan_;
    delete controller_plan_;

    planner_.reset();
    tc_.reset();
}
```

至此，move_base的源码分析完毕。

如果有错误，欢迎在文章最下面的Comments中指出，感谢~



### 参考文章

1. [ROS wiki: move_base](https://wiki.ros.org/move_base)

2. [ROS之tf2坐标转换包](https://blog.csdn.net/zhanghm1995/article/details/85803641)

3. [Navigation（五） Move_base最最全解析](https://www.cnblogs.com/JuiceCat/p/13040552.html)

   

<p align="right"><i> <font size="3"><font color = "brown">Last update on</font>: 2024/01/30 </font></i></p>


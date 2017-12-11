# SIT

------------------------------------------------------------------
文件结构
- client_code: 前端样式源代码
- views: 前端模板源代码
- gulpfile.js: 前端打包代码
- public: 打包后前端运行代码（临时）
- routes: express框架, 作为路由处理页面逻辑
- bin: express框架, 只修改端口3001
- app.js: express框架, 只设置了路由和fav icon
- package.json: express框架, 添加依赖包
- node_modules: 运行时下载的依赖包（临时）
------------------------------------------------------------------

# 环境配置
# 1. 安装环境
1.1. 安装nodejs环境
- curl --silent --location https://rpm.nodesource.com/setup_8.x | sudo bash -
- sudo yum -y install nodejs gcc gcc-c++
- sudo npm -g install gulp pm2 cnpm


1.2. 安装配置nginx
- sudo vi /etc/yum.repos.d/nginx.repo
修改内容如下：
------------------------------------------------------------------
[nginx]
name=nginx repo
baseurl=http://nginx.org/packages/centos/$releasever/$basearch/
gpgcheck=0
enabled=1
------------------------------------------------------------------
- sudo yum -y install nginx
- sudo vi /etc/nginx/conf.d/default.conf
修改内容如下：
------------------------------------------------------------------
server {
    listen 80 default;
}

server {
    listen       80;
    server_name  51qingcheng.com www.51qingcheng.com;

    location / {
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   Host      $http_host;
        proxy_pass         http://localhost:3000;
    }

    error_page   500 502 503 504  /50x.html;
    location = /50x.html {
        root   /usr/share/nginx/html;
    }
}

server {
    listen       80;
    server_name  sit.51qingcheng.com;

    location / {
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   Host      $http_host;
        proxy_pass         http://localhost:3001;
    }

    error_page   500 502 503 504  /50x.html;
    location = /50x.html {
        root   /usr/share/nginx/html;
    }
}
------------------------------------------------------------------

1.3. 安装Mongo DB
- sudo vi /etc/yum.repos.d/mongodb-org-3.4.repo
修改内容如下：
------------------------------------------------------------------
[mongodb-org-3.4]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/$releasever/mongodb-org/3.4/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-3.4.asc
------------------------------------------------------------------
- sudo yum install -y mongodb-org

# 2. 拷贝代码
2.1. 拷贝代码

2.2. 下载项目依赖包
[SIT]$ sudo cnpm install

2.3. 打包前端代码
[SIT]$ gulp


# 3. 运行
3.1. 启动Mongo DB
sudo service mongod start

3.2. 启动nginx
sudo nginx

3.3. 启动node项目
[SIT]$ pm2 start ./bin/www --name SIT

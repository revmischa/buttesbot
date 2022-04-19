FROM amazon/aws-lambda-nodejs:14
RUN yum install -y tcl-devel python3 gcc gcc-c++ make
RUN npm install npm@latest -g

WORKDIR /asset/nodejs/node_modules
RUN HOME=/tmp npm install --no-save tcl

RUN mkdir /asset/lib
RUN cp /usr/lib64/libtcl8.5.so /asset/lib/
WORKDIR /asset/lib
RUN ln -s libtcl8.5.so libtcl.so
RUN cp -rp /usr/share/tcl8.5 ./

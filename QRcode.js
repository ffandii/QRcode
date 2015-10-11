/*
 * QRcode javascript plugin
 * Created by ffandii on 2015-10-02.
 */
var QRcode;
(function(window){

    //默认参数设置
    var defaultOpt={
        text: "",
        level: 0,     //L:0 M:1 Q:2 H:2
        size: 278,
        foreColor: "#000000",   //前景色默认为黑色
        backColor: "#FFFFFF"   //背景色默认为白色
    };

    //可能用到的全局函数
    var floor=window.Math.floor,
        Number=window.Number,
        isNaN=window.isNaN,
        alert=window.alert,
        document=window.document,
        parseInt=window.parseInt;

    QRcode=function(opt,selector){
        this.version=0; //默认版本为0,0-39
        //options为QRcode对象的实例属性
        this.options={};
        (function(set,options,opt){
            var expColor=/^([#])+([a-zA-Z0-9]{6})+$/g; //验证颜色
            for(var key in set){
                var value=opt[key],type=typeof value;
                if(type!="undefined"&& type!="function" && type!="object"){
                    //options[key]=opt[key];
                    switch(key){
                        case "text": options["text"]=value.toString();break;
                        case "level": value=value.toString().toLowerCase();options["level"]=value=="l"?0:value=="m"?1:value=="q"?2:3;break;
                        case "size": var tmp=floor(Number(value));options["size"]=isNaN(Number(value))==false?(tmp<177?177:tmp>885?885:tmp):set["size"];break;
                        case "foreColor": options["foreColor"]=expColor.test(value)==true?value:set["foreColor"];break;
                        case "backColor": expColor.lastIndex=0;options["backColor"]=expColor.test(value)==true?value:set["backColor"];break;
                    }
                }
                else {
                    options[key]=set[key];
                }
            }
            if(options["text"]==""){ throw new Error("Input text can't be null!");}
        })(defaultOpt,this.options,opt);

        //将输入字符串转化为0/1编码的数据流
        this.dataStream=[];  //0-1数据流
        (function(data,text,level,that){
            var capacity=[[152,128,104,72],[272,224,176,128],[440,352,272,208],[640,512,384,288],[864,688,496,368],[1088,864,608,480],[1248,992,704,528],[1552,1232,880,688],[1856,1456,1056,800],[2192,1728,1232,976],
                [2592,2032,1440,1120],[2960,2320,1648,1264],[3424,2672,1952,1440],[3688,2920,2088,1576],[4184,3320,2360,1784],[4712,3624,2600,2024],[5176,4056,2936,2264],[5768,4504,3176,2504],[6360,5016,3560,2728],[6888,5352,3880,3080],
                [7456,5712,4096,3248],[8048,6256,4544,3536],[8752,6880,4912,3712],[9392,7312,5312,4112],[10208,8000,5744,4304],[10960,8496,6032,4768],[11744,9024,6464,5024],[12248,9544,6968,5288],[13048,10136,7288,5608],[13880,10984,7880,5960],
                [14744,11640,8264,6344],[15640,12328,8920,6760],[16568,13048,9368,7208],[17528,13800,9848,7688],[18448,14496,10288,7888],[19472,15312,10832,8432],[20528,15936,11408,8768],[21616,16816,12016,9136],[22496,17728,12656,9776],[23648,18672,13328,10208]];
            var length=text.length,lt1=12+8*length,lt2=20+8*length, i,j,mode,version;
            if(lt2>capacity[39][level]){ throw new Error("Input text is too long!"); }
            for(i=0;i<40;i++){                          //此时版本i刚好能装下输入的数据
                if(capacity[i][level]<=(i<=8?lt1:lt2)){} else{ version=i; mode=version>8?16:8; break; }
            }
            for(i=0;i<length;i++){
                var value=text.charCodeAt(i); if(value>127){ throw new Error("Input charset limit: ASCII"); }
                var bit=0x80; for(j=0;j<8;j++){ data.push(!!(bit&value)); bit>>=1; }
            }
            for(i=0;i<mode;i++) { data.unshift(length%2); length=parseInt(length/2); }
            data.unshift(0);data.unshift(0);data.unshift(1);data.unshift(0); //插入8位字节模式指示符
            data.push(0); data.push(0); data.push(0); data.push(0);
            for(i=0,j=(capacity[version][level]-data.length)>>3;i<j;i++){
                if(i%2==0){ data.push(1);data.push(1);data.push(1);data.push(0);data.push(1);data.push(1);data.push(0);data.push(0); }
                else { data.push(0);data.push(0);data.push(0);data.push(1);data.push(0);data.push(0);data.push(0);data.push(1); }
            }
            that.version=version;
        })(this.dataStream,this.options["text"],this.options["level"],this);

        //纠错编码，组合数据码和纠错码
        this.finalStream=[];
        (function(data,final,version,level){

            var bits=[0,7,7,7,7,7,0,0,0,0,0,0,0,3,3,3,3,3,3,3,4,4,4,4,4,4,4,3,3,3,3,3,3,3,0,0,0,0,0,0]; //码字填充后的剩余位

            var errorInfo=[[[1,26,19],[1,44,34],[1,70,55],[1,100,80],[1,134,108],[2,86,68],[2,98,78],[2,121,97],[2,146,116],[2,86,68,2],[4,101,81],[2,116,92,2],[4,133,107],[3,145,115,1],[5,109,87,1],[5,122,98,1],[1,135,107,5], [5,150,120,1],[3,141,113,4],[3,135,107,5],[4,144,116,4],[2,139,111,7],[4,151,121,5],[6,147,117,4],[8,132,106,4],[10,142,114,2],[8,152,122,4],[3,147,117,10],
                [7,146,116,7],[5,145,115,10],[13,145,115,3],[17,145,115],[17,145,115,1],[13,145,115,6],[12,151,121,7],[6,151,121,14],[17,152,122,4],[4,152,122,18],[20,147,117,4],[19,148,118,6]], [[1,26,16],[1,44,28],[1,70,44],[2,50,32],[2,67,43],[4,43,27],[4,49,31],[2,60,38,2],[3,58,36,2],[4,69,43,1],[1,80,50,4],[6,58,36,2],[8,59,37,1],[4,64,40,5],[5,65,41,5],[7,73,45,3],[10,74,46,1],
                [9,69,43,4],[3,70,44,11],[3,67,41,13],[17,68,42],[17,74,46],[4,75,47,14],[6,73,45,14],[8,75,47,13],[19,74,46,4],[22,73,45,3],[3,73,45,23],[21,73,45,7],[19,75,47,10],[2,74,46,29], [10,74,46,23],[14,74,46,21],[14,74,46,23],[12,75,47,26],[6,75,47,34],[29,74,46,14],[13,74,46,32],[40,75,47,7],[18,75,47,31]],[[1,26,13],[1,44,22],[2,35,17],[2,50,24],[2,33,15,2],[4,43,19],
                [2,32,14,4],[4,40,18,2],[4,36,16,4],[6,43,19,2],[4,50,22,4],[4,46,20,6],[8,44,20,4],[11,36,16,5],[5,54,24,7],[15,43,19,2],[1,50,22,15],[17,50,22,1],[17,47,21,4],[15,54,24,5], [17,50,22,6],[7,54,24,16],[11,54,24,14],[11,54,24,16],[7,54,24,22],[28,50,22,6],[8,53,23,26],[4,54,24,31],[1,53,23,37],[15,54,24,25],[42,54,24,1],[10,54,24,35],[29,54,24,19],
                [44,54,24,7],[39,54,24,14],[46,54,24,10],[49,54,24,10],[48,54,24,14],[43,54,24,22],[34,54,24,34]],[[1,26,9],[1,44,16],[2,35,13],[4,25,9],[2,33,11,2],[4,43,15],[4,39,13,1],[4,40,14,2],[4,36,12,4], [6,43,15,2],[3,36,12,8],[7,42,14,4],[12,33,11,4],[11,36,12,5],[11,36,12,7],[3,45,15,13],[2,42,14,17],[2,42,14,19],[9,39,13,16],[15,43,15,10],[19,46,16,6],[34,37,13],[16,45,15,14],
                [30,46,16,2],[22,45,15,13],[33,46,16,4],[12,45,15,28],[11,45,15,31],[19,45,15,26],[23,45,15,25],[23,45,15,28],[19,45,15,35],[11,45,15,46],[59,46,16,1],[22,45,15,41],[2,45,15,64], [24,45,15,46],[42,45,15,32],[10,45,15,67],[20,45,15,61]]]; //纠错的块数，码字总数，数据码字数

            //co为生成多项式的系数，参见QR码国家标准
            var co=[[7,21,102,238,149,146,229,87],[10,45,32,94,64,70,118,61,46,67,251],[13,78,140,206,218,130,104,106,100,86,100,176,152,74],[15,105,99,5,124,140,237,58,58,51,37,202,91,61,183,8],[16,120,225,194,182,169,147,191,91,3,76,161,102,109,107,104,120],
                [17,136,163,243,39,150,99,24,147,214,206,123,239,43,78,206,139,43],[18,153,96,98,5,179,252,148,152,187,79,170,118,97,184,94,158,234,215],[20,190,188,212,212,164,156,239,83,225,221,180,202,187,26,163,61,50,79,60,17],[22,231,165,105,160,134,219,80,98,172,8,74,200,53,221,109,14,230,93,242,247,171,210],
                [24,21,227,96,87,232,117,0,111,218,228,226,192,152,169,180,159,126,251,117,211,48,135,121,229],[26,70,218,145,153,227,48,102,13,142,245,21,161,53,165,28,111,201,145,17,118,182,103,2,158,125,173],[28,123,9,37,242,119,212,195,42,87,245,43,21,201,232,27,205,147,195,190,110,180,108,234,224,104,200,223,168],
                [30,180,192,40,238,216,251,37,156,130,224,193,226,173,42,125,222,96,239,86,110,48,50,182,179,31,216,152,145,173,41]];

            //生成多项式系数转伽罗华域表
            var a2v=[1,2,4,8,16,32,64,128,29,58,116,232,205,135,19,38,76,152,45,90,180,117,234,201,143,3,6,12,24,48,96,192,157,39,78,156,37,74,148,53,106,212,181,119,238,193,159,35,70,140,5,10,20,40,80,160,93,186,105,210,185,111,222,161,95,190,97,194,153,47,94,188,101,202,137,15,30,60,120,240,
                253,231,211,187,107,214,177,127,254,225,223,163,91,182,113,226,217,175,67,134,17,34,68,136,13,26,52,104,208,189,103,206,129,31,62,124,248,237,199,147,59,118,236,197,151,51,102,204,133,23,46,92,184,109,218,169,79,158,33,66,132,21,42,84,168,77,154,41,82,164,85,170,73,146,57,114,228,213,183,115,
                230,209,191,99,198,145,63,126,252,229,215,179,123,246,241,255,227,219,171,75,150,49,98,196,149,55,110,220,165,87,174,65,130,25,50,100,200,141,7,14,28,56,112,224,221,167,83,166,81,162,89,178,121,242,249,239,195,155,43,86,172,69,138,9,18,36,72,144,61,122,244,245,247,243,251,235,203,139,11,22,44,88,176,125,250,233,207,131,27,54,108,216,173,71,142,1];

            //伽罗华域转生成多项式表
            var v2a=[0,0,1,25,2,50,26,198,3,223,51,238,27,104,199,75,4,100,224,14,52,141,239,129,28,193,105,248,200,8,76,113,5,138,101,47,225,36,15,33,53,147,142,218,240,18,130,69,29,181,194,125,106,39,249,185,201,154,9,120,77,228,114,166,6,191,139,98,102,221,48,253,226,152,37,179,16,145,34,136,54,208,148,206,143,150,219,189,241,210,19,92,131,56,70,64,
                30,66,182,163,195,72,126,110,107,58,40,84,250,133,186,61,202,94,155,159,10,21,121,43,78,212,229,172,115,243,167,87,7,112,192,247,140,128,99,13,103,74,222,237,49,197,254,24,227,165,153,119,38,184,180,124,17,68,146,217,35,32,137,46,55,63,209,91,149,188,207,205,144,135,151,178,220,252,190,97,242,86,211,171,20,42,93,158,
                132,60,57,83,71,109,65,162,31,45,67,216,183,123,164,118,196,23,73,236,127,12,111,246,108,161,59,82,41,157,85,170,251,96,134,177,187,204,62,90,203,89,95,176,156,169,160,81,11,245,22,235,122,
                117,44,215,79,174,213,233,230,231,173,232,116,214,244,234,168,80,88,175];

            var errorStream=[],info=errorInfo[level][version],at,w=0,i,j,len,num,b=[],t=[],m,n,c,value,zone,real;  //纠错码字的0/1数据流
            var dataNum=[info[2],info[3]=="undefined"?0:(1+info[2])],piece=[info[0],info[3]=="undefined"?0:info[3]],correct=info[1]-info[2];
            for(i=0,len=co.length;i<len;i++){
                if(co[i][0]==correct) { at=i; break; }
            }
            for(i=0,num=dataNum[i];i<2&&num!=0;i++){   //第一块以及可能的第二块
                for(j=0,len=piece[i];j<len;j++){   //每一块的分数
                    for(m=0;m<correct;m++){
                        b[m]=[]; t[m]=[]; for(n=0;n<8;n++) { b[m][n]=false; }
                    }
                    for(m=0;m<num;m++){   //纠错码字编码电路
                        value=0;
                        for(n=0;n<8;n++){
                            value<<=1; value+=b[correct-1][n]^data[w]; w++;
                        }
                        zone=v2a[value];
                        for(n=1;n<correct;n++){
                            real=a2v[(zone+co[at][n+1])%255];
                            for(c=7;c>=0;c--){
                                t[n][c]=b[n-1][c]^(real%2); real>>=1;
                            }
                        }
                        real=a2v[(zone+co[at][1])%255];  //首位值得更新
                        for(c=7;c>=0;c--){
                            t[0][c]=real%2; real>>=1;    //存储中间值
                        }
                        for(n=0;n<correct;n++){
                            for(c=0;c<8;c++) { b[n][c]=t[n][c]; }
                        }
                    }
                    for(n=correct-1;n>=0;n--){
                        for(c=0;c<8;c++){
                            errorStream.push(b[n][c]);
                        }
                    }
                }
            }
        })(this.dataStream,this.finalStream,this.version,this.options["level"]);

        //胶片制作
        this.filmArray=[];
        (function(film,final,version){
            var length=21+version*4,i, j,pixel=false,len,limit=length-7,n,p,m;  //胶片的实际尺寸
            for(i=0;i<length;i++){        //胶片初始化
                film[i]=[];
                for(j=0;j<length;j++){
                    film[i][j]=true;      //true代表白色的模块
                }
            }
            for(i=0;i<7;i++){             //生成位置探测图形
                for(j=0;j<7;j++){
                    if((i==0||j==0||i==6||j==6)||(i>=2&&i<=4&&j>=2&&j<=4)) {
                        film[i][j]=film[i][limit+j]=film[limit+i][j]=false;
                    }
                }
            }

            for(j=6;j<=limit;j++){     //生成定位图形
                if(pixel==false) { film[j][6]=film[6][j]=false; } pixel=!pixel;
            }

            var axis=[[],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,50],[6,30,54],[6,32,58],[6,34,62],[6,26,46,66],[6,26,48,70],[6,26,50,74],[6,30,54,78],[6,30,56,82],[6,30,58,86],
                [6,34,62,90],[6,28,50,72,94],[6,26,50,74,98],[6,30,54,78,102],[6,28,54,80,106],[6,32,58,84,110],[6,30,58,86,114],[6,34,62,90,118],[6,26,50,74,98,122],[6,30,54,78,102,126],[6,26,52,78,104,130],
                [6,30,56,82,108,134],[6,34,60,86,112,138],[6,30,58,86,114,142],[6,34,62,90,118,146],[6,30,54,78,102,126,150],[6,24,50,76,102,128,154],[6,28,54,80,106,132,158],[6,32,58,84,110,136,162],[6,26,54,82,110,138,166],[6,30,58,86,114,142,170]];
            for(i=0,len=axis[version].length;i<len;i++){
                for(j=0;j<len;j++){
                    n=axis[version][i];p=axis[version][j];
                    if(!((n==6||n==limit)&&(p==6||p==limit))||(n==limit&&p==limit)){
                        film[n][p]=false;
                        for(m=0;m<5;m++) { film[n-2+m][p-2]=film[n-2+m][p+2]=film[n-2][p-2+m]=film[n+2][p-2+m]=false; }
                    }
                }
            }
        })(this.filmArray,this.finalStream,this.version);

        //胶片放映
        (function(film,options,selector){
            var size=options["size"],filmLength=film.length,times=floor(size/filmLength),gap=size%(times*filmLength),time=[];
            var container=document.body.querySelector(selector);  //获取容器元素的DOM引用
            if(container==null) { throw new Error("Element not found!"); }
            container.innerHTML="<canvas width='"+size+"' height='"+size+"'></canvas>";
            var canvas=container.querySelector("canvas"),context=canvas.getContext("2d");
            var image=new Image();
            var foreR=parseInt(options["foreColor"].slice(1,3),16),foreG=parseInt(options["foreColor"].slice(3,5),16),foreB=parseInt(options["foreColor"].slice(5,7),16);
            var backR=parseInt(options["backColor"].slice(1,3),16),backG=parseInt(options["backColor"].slice(3,5),16),backB=parseInt(options["backColor"].slice(5,7),16);
            image.src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAMSURBVBhXY/j//z8ABf4C/qc1gYQAAAAASUVORK5CYII=";
            context.drawImage(image,0,0,size,size); //写入图像花了10ms左右
            var imageData=context.getImageData(0,0,size,size),data=imageData.data,i,row=0,col=0,value,left,right,len;
            for(i=0;i<filmLength;i++) {  time[i]=times; }
            var mid=(filmLength-1)>>1;
            if(gap>=(mid+1)){     //调整像素单元的长宽比例适应容器
                for(i=0;i<filmLength;i+=2){ time[i]++; }
                if(gap-mid-1>0){
                    left=mid-(((gap-mid-1)>>1)<<1)-1;right=mid+(((gap-mid)>>1)<<1)-3;
                    for(i=left;i<=right;i+=2){ time[i]++; }
                }
            }
            else {
                if(gap>0){
                    left=mid-((gap>>1)<<1);right=mid+(((gap+1)>>1)<<1)-2;
                    for(i=left;i<=right;i+=2){ time[i]++; }
                }
            }
            var sumY=time[0],sumX=time[0],axisX=0;try{
            for(i=0,len=data.length;i<len;i+=4){
                if(film[axisX][col]==false){
                    data[i]=foreR;data[i+1]=foreG;data[i+2]=foreB;
                }
                else {
                    data[i]=backR;data[i+1]=backG;data[i+2]=backB;
                }
                value=(i>>2)%size;
                if((col==filmLength-1)&&(value==size-1)) { col=0; row++; sumY=time[0]; value=0;}
                if((value+1)%sumY==0){ col++; sumY+=time[col];}
                if((row+1)%sumX==0) { axisX++;sumX+=time[axisX]; }
            }}catch(ex){}
            imageData.data=data;
            context.putImageData(imageData,0,0);
        })(this.filmArray,this.options,selector);
    };

    QRcode.prototype={
        constructor: QRcode,

        getOptions: function(){   //取得二维码选项的信息
            var str="";
            for(var name in this.options){
                str+=name+":  "+this.options[name]+"\n";
            }
            return str;
        },

        resetOptions: function(){
            for(var key in defaultOpt){
                this.options[key]=defaultOpt[key];
            }
        },

        showDataStream: function(){
            var str="0 1 0 0<br>";
            for(var i=4;i<this.dataStream.length;i++){
                str+=(this.dataStream[i]==true?1:0)+" "+((i-3)%8==0?"<br>":"");
            }
            document.write(str);
        }
    };

})(window);
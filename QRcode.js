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
            data.unshift(0);data.unshift(0);data.unshift(1);data.unshift(0);
            that.version=version;
        })(this.dataStream,this.options["text"],this.options["level"],this);

        //纠错编码，组合数据码和纠错码
        this.finalStream=[];
        (function(data,final,version){
            var bits=[0,7,7,7,7,7,0,0,0,0,0,0,0,3,3,3,3,3,3,3,4,4,4,4,4,4,4,3,3,3,3,3,3,3,0,0,0,0,0,0]; //码字填充后的剩余位
            var errorInfo=[[[1,26,19],[1,44,34],[1,70,55],[1,100,80],[1,134,108],[2,86,68],[2,98,78],[2,121,97],[2,146,116],[2,86,68,2,87,69],[4,101,81],[2,116,92,2,117,93],[4,133,107],[3,145,115,1,146,116],[5,109,87,1,110,88],[5,122,98,1,123,99],[1,135,107,5,136,108],
                [5,150,120,1,151,121],[3,141,113,4,142,114],[3,135,107,5,136,108],[4,144,116,4,145,117],[2,139,111,7,140,112],[4,151,121,5,152,122],[6,147,117,4,148,118],[8,132,106,4,133,107],[10,142,114,2,143,115],[8,152,122,4,153,123],[3,147,117,10,148,118],
                [7,146,116,7,147,117],[5,145,115,10,146,116],[13,145,115,3,146,116],[17,145,115],[17,145,115,1,146,116],[13,145,115,6,146,116],[12,151,121,7,152,122],[6,151,121,14,152,122],[17,152,122,4,153,123],[4,152,122,18,153,123],[20,147,117,4,148,118],[19,148,118,6,149,119]],
                [[1,26,16],[1,44,28],[1,70,44],[2,50,32],[2,67,43],[4,43,27],[4,49,31],[2,60,38,2,61,39],[3,58,36,2,59,37],[4,69,43,1,70,44],[1,80,50,4,81,51],[6,58,36,2,59,37],[8,59,37,1,60,38],[4,64,40,5,65,41],[5,65,41,5,66,42],[7,73,45,3,74,46],[10,74,46,1,75,47],
                [9,69,43,4,70,44],[3,70,44,11,71,45],[3,67,41,13,68,42],[17,68,42],[17,74,46],[4,75,47,14,76,48],[6,73,45,14,74,46],[8,75,47,13,76,48],[19,74,46,4,75,47],[22,73,45,3,74,46],[3,73,45,23,74,46],[21,73,45,7,74,46],[19,75,47,10,76,48],[2,74,46,29,75,47],
                [10,74,46,23,75,47],[14,74,46,21,75,47],[14,74,46,23,75,47],[12,75,47,26,76,48],[6,75,47,34,76,48],[29,74,46,14,75,47],[13,74,46,32,75,47],[40,75,47,7,76,48],[18,75,47,31,76,48]],[[1,26,13],[1,44,22],[2,35,17],[2,50,24],[2,33,15,2,34,16],[4,43,19],
                [2,32,14,4,33,15],[4,40,18,2,41,19],[4,36,16,4,37,17],[6,43,19,2,44,20],[4,50,22,4,51,23],[4,46,20,6,47,21],[8,44,20,4,45,21],[11,36,16,5,37,17],[5,54,24,7,55,25],[15,43,19,2,44,20],[1,50,22,15,51,23],[17,50,22,1,51,23],[17,47,21,4,48,22],[15,54,24,5,55,25],
                [17,50,22,6,51,23],[7,54,24,16,55,25],[7,54,24,16,55,25],[11,54,24,16,55,25],[7,54,24,22,55,25],[28,50,22,6,51,23],[8,53,23,26,54,24],[4,54,24,31,55,25],[1,53,23,37,54,24],[15,54,24,25,55,25],[42,54,24,1,55,25],[10,54,24,35,55,25],[29,54,24,19,55,25],
                [44,54,24,7,55,25],[39,54,24,14,55,25],[46,54,24,10,55,25],[49,54,24,10,55,25],[48,54,24,14,55,25],[43,54,24,22,55,25],[34,54,24,34,55,25]],[[1,26,9],[1,44,16],[2,35,13],[4,25,9],[2,33,11,2,34,12],[4,43,15],[4,39,13,1,40,14],[4,40,14,2,41,15],[4,36,12,4,37,13],
                [6,43,15,2,44,16],[3,36,12,8,37,13],[7,42,14,4,43,15],[12,33,11,4,34,12],[11,36,12,5,37,13],[11,36,12,7,37,13],[3,45,15,13,46,16],[2,42,14,17,43,15],[2,42,14,19,43,15],[9,39,13,16,40,14],[15,43,15,10,44,16],[19,46,16,6,47,17],[34,37,13],[16,45,15,14,46,16],
                [30,46,16,2,47,17],[22,45,15,13,46,16],[33,46,16,4,47,17],[12,45,15,28,46,16],[11,45,15,31,46,16],[19,45,15,26,46,16],[23,45,15,25,46,16],[23,45,15,28,46,16],[19,45,15,35,46,16],[11,45,15,46,46,16],[59,46,16,1,47,17],[22,45,15,41,46,16],[2,45,15,64,46,16],
                [24,45,15,46,46,16],[42,45,15,32,46,16],[10,45,15,67,46,16],[20,45,15,61,46,16]]]; //纠错的块数，码字总数，数据码字数
        })(this.dataStream,this.finalStream,this.version);

        //胶片制作
        this.filmArray=[];
        (function(film,final,version){
            var length=21+version*4,i, j,pixel=false,len,limit=length- 7,n,p,m;  //胶片的实际尺寸
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
            var mid=(filmLength-1)/2;
            if(gap>=(mid+1)){     //调整像素单元的长宽比例适应容器
                for(i=0;i<filmLength;i+=2){ time[i]++; }
                if(gap-mid-1>0){
                    left=mid-floor(((gap-mid-1)/2))*2-1;right=mid+floor(((gap-mid)/2))*2-3;
                    for(i=left;i<=right;i+=2){ time[i]++; }
                }
            }
            else {
                if(gap>0){
                    left=mid-floor((gap/2))*2;right=mid+floor(((gap+1)/2))*2-2;
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

        showOptions: function(){   //取得二维码选项的信息
            var str="";
            for(var name in this.options){
                str+=name+":  "+this.options[name]+"\n";
            }
            alert(str);
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
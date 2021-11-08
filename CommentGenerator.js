/*
Copyright (c) 2015 Takayasu Machimura (kilin)
This software is released under the MIT License.
*/
//ver 0.0.7改95
function CommentGenerator(Handle, Comment, hcgFormat, txtFormat, owner, service, timestamp)
{
	this.timer;
	this.longline = 0;
	this.Owner = owner;
	var TxtFormat = new Object();
	TxtFormat = txtFormat;
	var HcgFormat = new Object();
	HcgFormat = hcgFormat;
	//コテハン設定(リスナーが色やスキンを指定)
	this.handle = Handle;
	this.PrivateColorPos = Handle.indexOf("{");
	this.PrivateColor = "";
	this.PrivateSkin = "";
	this.SiteColor = "";
	var BufColorPos = -1;
	var BufColor ="";
	var TypeCount = 0;
	var TypeLock = 0;
	this.TypeTimer;
	this.moveX = 0;
	this.moveY = 0;
	this.target = new Object();
	this.fin_tick;
	this.fout_tick;
	this.zin_tick;
	this.zout_tick;
	this.accel = 20;
	this.brake = 0.5;
	this.b_width;

	//色指定
	if(TxtFormat['comToColor']==1){
		BufColorPos=Comment.indexOf("{");
		if(BufColorPos!=-1){
			BufColor = Comment.substr(BufColorPos+1,7).match(/[\da-fA-F]{6}/);
		}
	}
	if((this.PrivateColorPos!=-1)&&((TxtFormat['userBGColor']==1)||(TxtFormat['exColor']!=0))) {
		this.PrivateColor = Handle.substr(this.PrivateColorPos+1,7).match(/[\da-fA-F]{6}/);
	}
	if((BufColor != "")&&(BufColor != null)){
		this.PrivateColor = BufColor;
	}
	//スキン指定
	this.PrivateSkinStart = Handle.indexOf("[");
	this.PrivateSkinEnd = Handle.indexOf("]");
	if((TxtFormat['userSkinName']==1)&&(this.PrivateSkinStart!=-1)&&(this.PrivateSkinEnd!=-1)) {
		if(this.PrivateSkinEnd-this.PrivateSkinStart-1!=0) {
			this.PrivateSkin = TxtFormat['SkinFolder']+"/skin_"+Handle.substr(this.PrivateSkinStart+1,this.PrivateSkinEnd-this.PrivateSkinStart-1)+".png";
		}
		console.log(this.PrivateSkin);
	}

	//サイト毎の色やスキン
	if(service!=null){
		SiteOption = (name)=>{
			if(TxtFormat[name]!=null){
				this.SiteColor = TxtFormat[name].color;
				if((TxtFormat[name].skin)&&(this.PrivateSkin=="")) this.PrivateSkin = TxtFormat[name].skin;
			}
		}
		switch(service.value.toLowerCase()){
			case "nicolive":
				SiteOption('Nico');
				break;
			case "youtubelive":
				SiteOption('YouTube');
				break;
			case "twitch":
				SiteOption('Twitch');
				break;
			case "openrec":
				SiteOption('Openrec');
				break;
			case "twicas":
				SiteOption('Twicas');
				break;
			case "mirrativ":
				SiteOption('Mirrativ');
				break;
			case "linelive":
				SiteOption('LineLive');
				break;
			case "whowatch":
				SiteOption('Whowatch');
				break;
			case "mildom":
				SiteOption('Mildom');
				break;
			case "bigo":
				SiteOption('Bigo');
				break;
			case "bouyomichan":
				SiteOption('BouyomiChan');
				break;
			default:
				break;
		}
	}else{//予備のelse
	}

	//色やスキンをハンドルネームから削除
	if((this.PrivateColorPos!=-1)&&(this.PrivateSkin != "")&&(this.PrivateSkinStart!=-1)&&(this.PrivateSkinEnd!=-1)) {
		if(this.PrivateColorPos < this.PrivateSkinStart) {
			this.handle = Handle.substr(0,this.PrivateColorPos);
		} else {
			this.handle = Handle.substr(0,this.PrivateSkinStart);
		}
	} else if(this.PrivateColorPos!=-1) {
		this.handle = Handle.substr(0,this.PrivateColorPos);
	} else if((this.PrivateSkin != "")&&(this.PrivateSkinStart!=-1)&&(this.PrivateSkinEnd!=-1)) {
		this.handle = Handle.substr(0,this.PrivateSkinStart);
	}
	//ハンドルネーム処理
	if(TxtFormat['HandleVisible'] == "1") {
		var handlebuf = new createjs.Text("", TxtFormat['TxtSize']+"px "+TxtFormat['TxtFont'], "#000000");
		for (var i=0; i<this.handle.length; i++) {
			if(this.handle.substr(i,1)=="\n") break;//改行は強制終了
			handlebuf.text += this.handle.substr(i,1);
			if(handlebuf.getMeasuredWidth() > Number(TxtFormat['HandleLimit'])) {
				//すまんが省略
				if(TxtFormat['HandleTrim'].trim() != "") {
					 this.handle =
					  handlebuf.text.substr(0, (handlebuf.text.length-TxtFormat['HandleTrim'].trim().length))
					 + TxtFormat['HandleTrim'].trim();
					break;
				}
			}
		}
		delete handlebuf;
		if(TxtFormat['HandleOrder'] == 1) {
			this.handle =  this.handle + TxtFormat['Honorific'];
		} else if(TxtFormat['HandleOrder'] == 2) {
			this.handle =  TxtFormat['Honorific'] +  this.handle;
		}
	}
	//コメントカラー省略
	if(TxtFormat['comCC'] == 1){
		this.comment = Comment.replace(/\{\#?[\da-fA-F]+\}?/,"");
	}else{
		this.comment = Comment;
	}
	//余白
	this.upSpace = Number(TxtFormat['TxtUpSpace']);
	this.leftSpace = Number(TxtFormat['TxtLeftSpace']);

	//テキスト
	if((TxtFormat['userBGColor']==0)&&((TxtFormat['exColor']==1)&&(TxtFormat['exColorArea']!=2))&&((this.PrivateColor != "")&&(this.PrivateColor != null))){
		this.handletext = new createjs.Text((""), TxtFormat['TxtSize']+"px "+TxtFormat['TxtFont'], "#"+this.PrivateColor);
	}else if(((TxtFormat['exColor']==1)&&(TxtFormat['exColorArea']!=2))&&(this.Owner == 1)){
		this.handletext = new createjs.Text((""), TxtFormat['TxtSize']+"px "+TxtFormat['TxtFont'], "#"+TxtFormat['ownerColor']);
	}else if(((TxtFormat['SiteColor']==2)&&(TxtFormat['SiteColorArea']!=2))&&(this.SiteColor != "")&&(this.SiteColor != null)){
		this.handletext = new createjs.Text((""), TxtFormat['TxtSize']+"px "+TxtFormat['TxtFont'], "#"+this.SiteColor);
	}else{
		this.handletext = new createjs.Text((""), TxtFormat['TxtSize']+"px "+TxtFormat['TxtFont'], "#"+TxtFormat['TxtColor']);
	}
	if((TxtFormat['userBGColor']==0)&&((TxtFormat['exColor']==1)&&(TxtFormat['exColorArea']!=1))&&((this.PrivateColor != "")&&(this.PrivateColor != null))){
		this.TypeBuf = new createjs.Text((""), TxtFormat['TxtSize']+"px "+TxtFormat['TxtFont'], "#"+this.PrivateColor);
	}else if(((TxtFormat['exColor']==1)&&(TxtFormat['exColorArea']!=1))&&(this.Owner == 1)){
		this.TypeBuf = new createjs.Text((""), TxtFormat['TxtSize']+"px "+TxtFormat['TxtFont'], "#"+TxtFormat['ownerColor']);
	}else if(((TxtFormat['SiteColor']==2)&&(TxtFormat['SiteColorArea']!=1))&&(this.SiteColor != "")&&(this.SiteColor != null)){
		this.TypeBuf = new createjs.Text((""), TxtFormat['TxtSize']+"px "+TxtFormat['TxtFont'], "#"+this.SiteColor);
	}else{
		this.TypeBuf = new createjs.Text((""), TxtFormat['TxtSize']+"px "+TxtFormat['TxtFont'], "#"+TxtFormat['TxtColor']);
	}
	//サイト毎設定
	if(service!=null){
		switch(service.value.toLowerCase()){
			case "nicolive":
				this.TypeBuf.text += ((TxtFormat['Nico']!=null)?TxtFormat['Nico'].value:"【ニコ生】");
				break;
			case "youtubelive":
				this.TypeBuf.text += ((TxtFormat['YouTube']!=null)?TxtFormat['YouTube'].value:"【YouTube】");
				break;
			case "twitch":
				this.TypeBuf.text += ((TxtFormat['Twitch']!=null)?TxtFormat['Twitch'].value:"【twitch】");
				break;
			case "openrec":
				this.TypeBuf.text += ((TxtFormat['Openrec']!=null)?TxtFormat['Openrec'].value:"【OPENREC】");
				break;
			case "twicas":
				this.TypeBuf.text += ((TxtFormat['Twicas']!=null)?TxtFormat['Twicas'].value:"【Twicas】");
				break;
			case "mirrativ":
				this.TypeBuf.text += ((TxtFormat['Mirrativ']!=null)?TxtFormat['Mirrativ'].value:"【Mirrativ】");
				break;
			case "linelive":
				this.TypeBuf.text += ((TxtFormat['LineLive']!=null)?TxtFormat['LineLive'].value:"【LINELIVE】");
				break;
			case "whowatch":
				this.TypeBuf.text += ((TxtFormat['Whowatch']!=null)?TxtFormat['Whowatch'].value:"【ふわっち】");
				break;
			case "mildom":
				this.TypeBuf.text += ((TxtFormat['Mildom']!=null)?TxtFormat['Mildom'].value:"【Mildom】");
				break;
			case "bigo":
				this.TypeBuf.text += ((TxtFormat['Bigo']!=null)?TxtFormat['Bigo'].value:"【Bigo】");
				break;
			case "bouyomichan":
				this.TypeBuf.text += ((TxtFormat['BouyomiChan']!=null)?TxtFormat['BouyomiChan'].value:"");
				break;
			default:
				this.TypeBuf.text += ((TxtFormat['Nothing']!=null)?TxtFormat['Nothing'].value:"");
				break;
		}
	}else{
		this.TypeBuf.text += ((TxtFormat['Nothing']!=null)?TxtFormat['Nothing'].value:"");
	}
	if(TxtFormat['SiteName']=='0'){
		this.handletext.text = this.TypeBuf.text;
		this.TypeBuf.text = "";
	}
	//ハンドルネーム設定
	if(TxtFormat['HandleVisible'] == "1") {
		this.handletext.text += this.handle;
	}
	if(!HcgFormat['VL']){
		let spaser = new createjs.Text((""), TxtFormat['TxtSize']+"px "+TxtFormat['TxtFont'], "#000000");
		for (var i=0; spaser.getMeasuredWidth()<this.handletext.getMeasuredWidth(); i++){
			spaser.text += " ";
		}
		this.TypeBuf.text = spaser.text + this.TypeBuf.text;
	}
	//囲み文字の始点追加
	if(HcgFormat['ComStart']=="\n\t"){
		if(((TxtFormat['newLine'] == 1||TxtFormat['newLine'] == 2||TxtFormat['newLine'] == 4||TxtFormat['newLine'] == 5)&&this.longline<HcgFormat['LineLimit'])&&(this.TypeBuf.text!="")){
			if(TxtFormat['newLine'] == 1){
				this.TypeBuf.font = (TxtFormat['TxtSize']/2)+"px "+TxtFormat['TxtFont'];
			}
			this.textwidth=this.TypeBuf.getMeasuredWidth();
			this.TypeBuf.text += HcgFormat['ComStart'];
			this.longline++;
		}else{
			this.TypeBuf.text += " ";
		}
	}else{
		this.TypeBuf.text += HcgFormat['ComStart'];
	}
	TypeCount = this.TypeBuf.text.length;//ここで一文字ずつ入力の取得

	//改行処理
	var subwidth=((this.longline > 0)?this.textwidth:0);
	for (var i=0; i<this.comment.length; i++) {
		if(this.comment.substr(i,1)=="\n"&&TxtFormat['ComNL']==0) continue;//改行スルー
		if(!(this.comment.substr(i,1)=="\n"&&TxtFormat['ComNL']==1)) this.TypeBuf.text += this.comment.substr(i,1);
		if((this.comment.substr(i,1)=="\n"&&TxtFormat['ComNL']==1)||(Number(this.TypeBuf.getMeasuredWidth()) > Number(TxtFormat['TxtLength'])+subwidth)) {
			//console.log(Number(Number(this.TypeBuf.getMeasuredWidth())+this.leftSpace));
			if((TxtFormat['newLine'] == 1||TxtFormat['newLine'] == 3)&&(this.TypeBuf.font==TxtFormat['TxtSize']+"px "+TxtFormat['TxtFont'])){
				//フォントサイズ変更
				if(TxtFormat['newLine'] == 1){
					this.TypeBuf.font = (TxtFormat['TxtSize']/2)+"px "+TxtFormat['TxtFont'];
				}else if(TxtFormat['newLine'] == 3){
					this.TypeBuf.font = (Math.ceil(TxtFormat['TxtSize']/3)*2)+"px "+TxtFormat['TxtFont'];
				}
			}else if(((TxtFormat['newLine'] == 1 &&(this.TypeBuf.font!=(TxtFormat['TxtSize']+"px "+TxtFormat['TxtFont'])))
			 ||TxtFormat['newLine'] == 2||TxtFormat['newLine'] == 4||TxtFormat['newLine'] == 5)&&this.longline<HcgFormat['LineLimit']){
				//文の幅取得
				var tmpcomment = new createjs.Text(this.TypeBuf.text.slice(0,-1), this.TypeBuf.font, "#000000");
				var bufwidth = Number(tmpcomment.getMeasuredWidth());
				if((this.textwidth == null)||(this.textwidth < bufwidth - subwidth)){
					this.textwidth = bufwidth - subwidth;
				}
				subwidth = bufwidth;
				delete tmpcomment;
				//ここで改行の追加
				if((this.comment.substr(i,1)=="\n"&&TxtFormat['ComNL']==1)) this.TypeBuf.text += "\n\t";
				else this.TypeBuf.text = this.TypeBuf.text.slice(0,-1) + "\n\t" + this.TypeBuf.text.slice(-1);
				this.longline++;
			}else{
				//長かったので省略
				if(TxtFormat['TxtLengthValue'].trim() != ""&&(this.TypeBuf.text.length-TxtFormat['TxtLengthValue'].trim().length>0)) {
					this.TypeBuf.text =
					  this.TypeBuf.text.substr(0, (this.TypeBuf.text.length-TxtFormat['TxtLengthValue'].trim().length))
					 + TxtFormat['TxtLengthValue'].trim();
					break;
				}
			}
		}
	}
	if(this.longline){
		//改行があった場合に再び文の幅取得
		var tmpcomment = new createjs.Text(this.TypeBuf.text.slice(0,-1), this.TypeBuf.font, "#000000");
		var bufwidth = Number(tmpcomment.getMeasuredWidth());
		if((this.textwidth == null)||(this.textwidth < bufwidth - subwidth)){
			this.textwidth = bufwidth - subwidth;
		}
	}
	//一文字ずつ表示させるための準備
	if(TxtFormat['typeTime']!='0'){
		if(TypeCount>0){
			this.textcomment = new createjs.Text(this.TypeBuf.text.substring(0,TypeCount)+HcgFormat['ComEnd'],this.TypeBuf.font,this.TypeBuf.color);
		}else{
			this.textcomment = new createjs.Text(HcgFormat['ComEnd'],this.TypeBuf.font,this.TypeBuf.color);
		}
	}else{
		//準備がいらなかった模様
		this.TypeBuf.text += HcgFormat['ComEnd'];
		this.textcomment = this.TypeBuf;
	}
	//縁の色
	if((TxtFormat['userBGColor']==0)&&((TxtFormat['exColor']==2)&&(TxtFormat['exColorArea']!=2))&&((this.PrivateColor != "")&&(this.PrivateColor != null))){
		this.handletextedge = new createjs.Text(this.handletext.text, this.textcomment.font, "#"+this.PrivateColor);
	}else if(((TxtFormat['exColor']==2)&&(TxtFormat['exColorArea']!=2))&&(this.Owner == 1)){
		this.handletextedge = new createjs.Text(this.handletext.text, this.textcomment.font, "#"+TxtFormat['ownerColor']);
	}else if(((TxtFormat['SiteColor']==3)&&(TxtFormat['SiteColorArea']!=2))&&(this.SiteColor != "")&&(this.SiteColor != null)){
		this.handletextedge = new createjs.Text(this.handletext.text, this.textcomment.font, "#"+this.SiteColor);
	}else{
		this.handletextedge = new createjs.Text(this.handletext.text, this.textcomment.font, "#"+TxtFormat['TxtEdgeColor']);
	}
	if((TxtFormat['userBGColor']==0)&&((TxtFormat['exColor']==2)&&(TxtFormat['exColorArea']!=1))&&((this.PrivateColor != "")&&(this.PrivateColor != null))){
		this.textedgecomment = new createjs.Text(this.textcomment.text, this.textcomment.font, "#"+this.PrivateColor);
	}else if(((TxtFormat['exColor']==2)&&(TxtFormat['exColorArea']!=1))&&(this.Owner == 1)){
		this.textedgecomment = new createjs.Text(this.textcomment.text, this.textcomment.font, "#"+TxtFormat['ownerColor']);
	}else if(((TxtFormat['SiteColor']==3)&&(TxtFormat['SiteColorArea']!=1))&&(this.SiteColor != "")&&(this.SiteColor != null)){
		this.textedgecomment = new createjs.Text(this.textcomment.text, this.textcomment.font, "#"+this.SiteColor);
	}else{
		this.textedgecomment = new createjs.Text(this.textcomment.text, this.textcomment.font, "#"+TxtFormat['TxtEdgeColor']);
	}
	//縁を作る
	this.handletextedge.outline = true;
	this.handletextedge.outline = Number(TxtFormat['TxtEdgeValue']);;
	this.textedgecomment.outline = true;
	this.textedgecomment.outline = Number(TxtFormat['TxtEdgeValue']);
	if(TxtFormat['TxtEdgeType'] == 0) {
		this.handletextedge.visible = false;
		this.textedgecomment.visible = false;
	}
	//文の幅の取り込み
	if(!this.longline||(TxtFormat['typeTime']!='0')){
		this.textwidth = this.textcomment.getMeasuredWidth();
	}
	this.textedgewidth = this.textwidth;
	this.b_width=(HcgFormat['SkinWidth']=="FIX")?this.textwidth+this.leftSpace:HcgFormat['SkinWidth'];
	
	//行間
	this.textcomment.lineHeight = Number(TxtFormat['TxtSize']) + Number(TxtFormat['lineHeight']);
	this.textedgecomment.lineHeight = Number(TxtFormat['TxtSize']) + Number(TxtFormat['lineHeight']);
	Main = ()=>{//動かす部分
		//フェードイン
		fade_In = (function() {
			if(this.base.alpha < (((TxtFormat['A_area'] == 0)?this.target.alpha:1)-0.01)){
				this.base.alpha += ((TxtFormat['A_area'] == 0)?this.target.alpha:1)/((HcgFormat['FrameRate'])*Number(TxtFormat['F_in_k']));
			}else{
				this.base.alpha = (TxtFormat['A_area'] == 0)?this.target.alpha:1;
				createjs.Ticker.removeEventListener('tick', this.fin_tick);
			}
		});
		//フェードアウト
		fade_Out = (function() {
			if(this.base.alpha > 0.01){
				this.base.alpha -= ((TxtFormat['A_area'] == 0)?this.target.alpha:1)/((HcgFormat['FrameRate'])*Number(TxtFormat['F_out_k']));
			}else{
				this.base.alpha = 0;
				createjs.Ticker.removeEventListener('tick', this.fout_tick);
			}
		});

		//ズームイン
		zoom_In = (function() {
			if((this.tx.scaleX < 1)||(this.tx.scaleY < 1)){
				if(this.tx.scaleX < 1){
					this.tx.scaleX += 1/((HcgFormat['FrameRate'])*Number(TxtFormat['Z_in_k']));
					this.bg.scaleX = this.tx.scaleX;
				}
				if(this.tx.scaleY < 1){
					this.tx.scaleY += 1/((HcgFormat['FrameRate'])*Number(TxtFormat['Z_in_k']));
					this.bg.scaleY = this.tx.scaleY;
				}
			}else{
				this.tx.scaleX = 1;
				this.tx.scaleY = 1;
				this.bg.scaleX = 1;
				this.bg.scaleY = 1;
				createjs.Ticker.removeEventListener('tick', this.zin_tick);
			}
		});
		//ズームアウト
		zoom_Out = (function() {
			if((this.tx.scaleX >= 0) && (this.tx.scaleY >= 0)){
				if(TxtFormat['Z_out']%2 == 1){
					this.tx.scaleX -= 1/((HcgFormat['FrameRate'])*Number(TxtFormat['Z_out_k']));
					this.bg.scaleX = this.tx.scaleX;
				}
				if(TxtFormat['Z_out']/2 >= 1){
					this.tx.scaleY -= 1/((HcgFormat['FrameRate'])*Number(TxtFormat['Z_out_k']));
					this.bg.scaleY = this.tx.scaleY;
				}
				if(this.tx.scaleX <= 0) this.tx.scaleX = this.bg.scaleX = 0;
				if(this.tx.scaley <= 0) this.tx.scaleY = this.bg.scaleY = 0;
			}else{
				if(TxtFormat['Z_out']%2 == 1){
					this.tx.scaleX = 0;
					this.bg.scaleX = 0;
				}
				if(TxtFormat['Z_out']/2 >= 1){
					this.tx.scaleY = 0;
					this.bg.scaleY = 0;
				}
				createjs.Ticker.removeEventListener('tick', this.zout_tick);
			}
		});

		this.animetype = 0;	//0:in 1:out
		this.bg = new createjs.Container();
		this.tx = new createjs.Container();
		this.base = new createjs.Container();

		switch(Number(TxtFormat['Skin_Align'])%10){
			default:
			case 1:
				this.skinimage.regX = this.skinimage.x = 0;
				break;
			case 2:
				this.skinimage.regX = this.skinimage.x = (((HcgFormat['SkinWidth']=="FIX")?Number(TxtFormat['HandleLimit'])+this.textwidth+this.leftSpace:Number(HcgFormat['SkinWidth']))/2)-1;
				break;
			case 3:
				this.skinimage.regX = this.skinimage.x = ((HcgFormat['SkinWidth']=="FIX")?Number(TxtFormat['HandleLimit'])+this.textwidth+this.leftSpace:Number(HcgFormat['SkinWidth']))-1;
				break;
		}
		switch(Math.floor(Number(TxtFormat['Skin_Align'])/10)){
			default:
			case 1:
				this.skinimage.regY = this.skinimage.y = 0;
				break;
			case 2:
				this.skinimage.regY = this.skinimage.y = ((((TxtFormat['newLine'] == 4)?(Number(TxtFormat['TxtUpSpace'])+(this.textcomment.lineHeight)):Number(HcgFormat['SkinHeight']))*(1+this.longline))/2)-1;
				break;
			case 3:
				this.skinimage.regY = this.skinimage.y = (((TxtFormat['newLine'] == 4)?(Number(TxtFormat['TxtUpSpace'])+(this.textcomment.lineHeight)):Number(HcgFormat['SkinHeight']))*(1+this.longline))-1;
				break;
		}
		if(TxtFormat['TimeStamp'] != 1)this.bg.addChild(this.bgcolorbar);
		this.bg.addChild(this.skinimage);
		if(TxtFormat['TimeStamp'] == 1)this.bg.addChild(this.bgcolorbar);
		this.tx.addChild(this.handletextedge);
		this.tx.addChild(this.handletext);
		this.tx.addChild(this.textedgecomment);
		this.tx.addChild(this.textcomment);

		switch(Number(TxtFormat['Com_Align'])%10){
			default:
			case 1:
				this.bg.regX = this.bg.x = 0;
				this.tx.regX = this.tx.x = 0;
				break;
			case 2:
				this.bg.regX = this.bg.x = (((HcgFormat['SkinWidth']=="FIX")?Number(TxtFormat['HandleLimit'])+this.textwidth+this.leftSpace:Number(HcgFormat['SkinWidth']))/2)-1;
				this.tx.regX = this.tx.x = (((HcgFormat['SkinWidth']=="FIX")?Number(TxtFormat['HandleLimit'])+this.textwidth+this.leftSpace:Number(HcgFormat['SkinWidth']))/2)-1;
				break;
			case 3:
				this.bg.regX = this.bg.x = ((HcgFormat['SkinWidth']=="FIX")?Number(TxtFormat['HandleLimit'])+this.textwidth+this.leftSpace:Number(HcgFormat['SkinWidth']))-1;
				this.tx.regX = this.tx.x = ((HcgFormat['SkinWidth']=="FIX")?Number(TxtFormat['HandleLimit'])+this.textwidth+this.leftSpace:Number(HcgFormat['SkinWidth']))-1;
				break;
		}
		switch(Math.floor(Number(TxtFormat['Com_Align'])/10)){
			default:
			case 1:
				this.bg.regY = this.bg.y = 0;
				this.tx.regY = this.tx.y = 0;
				break;
			case 2:
				this.bg.regY = this.bg.y = ((((TxtFormat['newLine'] == 4)?(Number(TxtFormat['TxtUpSpace'])+(this.textcomment.lineHeight)):Number(HcgFormat['SkinHeight']))*(1+this.longline))/2)-1;
				this.tx.regY = this.tx.y = ((((TxtFormat['newLine'] == 4)?(Number(TxtFormat['TxtUpSpace'])+(this.textcomment.lineHeight)):Number(HcgFormat['SkinHeight']))*(1+this.longline))/2)-1;
				break;
			case 3:
				this.bg.regY = this.bg.y = (((TxtFormat['newLine'] == 4)?(Number(TxtFormat['TxtUpSpace'])+(this.textcomment.lineHeight)):Number(HcgFormat['SkinHeight']))*(1+this.longline))-1;
				this.tx.regY = this.tx.y = (((TxtFormat['newLine'] == 4)?(Number(TxtFormat['TxtUpSpace'])+(this.textcomment.lineHeight)):Number(HcgFormat['SkinHeight']))*(1+this.longline))-1;
				break;
		}
		this.base.addChild(this.bg);
		this.base.addChild(this.tx);
		if(TxtFormat['A_area']==1){ //背景に不透明度
			this.bgcolorbar.alpha = Number(TxtFormat['Base_a']);
			this.skinimage.alpha = Number(TxtFormat['Base_a']);
		}else if(TxtFormat['A_area']==2){ //文字に不透明度
			this.textcomment.alpha = Number(TxtFormat['Base_a']);
			this.textedgecomment.alpha = Number(TxtFormat['Base_a']);
		}else{ //全体に不透明度
			if(!TxtFormat['F_in']) this.base.alpha = Number(TxtFormat['Base_a']);
		}
		if(TxtFormat['F_in']){
			this.base.alpha = 0;
			this.target.alpha = TxtFormat['Base_a'];
		}
		if(TxtFormat['Z_in'] > 0){
			if(TxtFormat['Z_in']%2 == 1) this.tx.scaleX = 0;
			if(TxtFormat['Z_in']/2 >= 1) this.tx.scaleY = 0;
			this.zin_tick = createjs.Ticker.addEventListener('tick', zoom_In.bind(this));
		}

		//高さの初期設定
		this.handletext.y = Number(TxtFormat['TxtUpSpace']);
		this.handletextedge.y = Number(TxtFormat['TxtUpSpace']);
		this.textcomment.y = Number(TxtFormat['TxtUpSpace']);
		this.textedgecomment.y = Number(TxtFormat['TxtUpSpace']);
		if(TxtFormat['yReverse'] == 0){
			if(TxtFormat['newLine'] == 4){
				this.base.line = this.textcomment.lineHeight;
			}else{
				this.base.line = HcgFormat['SkinHeight'];
			}
			//キャンバスの高さを超えてた場合
			if((this.base.line*(Number(HcgFormat['CommentMax'])*2))>HcgFormat['CanvasHeight']){
				if((TxtFormat['newLine'] == 4) || (TxtFormat['newLine'] == 5)){
					this.base.line = HcgFormat['CanvasHeight']-(this.base.line*(1+this.longline));
				}else{
					this.base.line = HcgFormat['CanvasHeight']-this.base.line;
				}
			}else{
				if((TxtFormat['newLine'] == 4) || (TxtFormat['newLine'] == 5)){
					if(TxtFormat['NLset'] > 0){
						this.base.line = this.base.line*(Number(TxtFormat['NLset'])-(1+this.longline));
					}else{
						this.base.line = this.base.line*(Number(HcgFormat['CommentMax'])*2-(1+this.longline));
					}
				}else{
					this.base.line = this.base.line*(Number(HcgFormat['CommentMax'])-1);
				}
			}
		}else{//上から
			this.base.line = 0;
		}
		if(TxtFormat['Direction'] == 3){//カスタム
			if(TxtFormat['inY'].match(/RND/i)){
				this.base.y = RND(TxtFormat['inY']) + this.base.line;
			}else{
				this.base.y = Number(TxtFormat['inY']) + this.base.line;
			}
			this.target.sy = this.base.y - this.base.line;
		}else{
			this.base.y = this.base.line;
		}
		//開始位置の初期設定
		if(TxtFormat['Direction'] == 3){//カスタム
			if(TxtFormat['inX'].match(/RND/i)){
				this.base.x = RND(TxtFormat['inX']);
			}else{
				this.base.x = Number(TxtFormat['inX']);
			}
			if((TxtFormat['ownerReverse'] == 1) && (this.Owner == 1))
				this.base.x *= -1;
			this.target.sx = this.base.x;
			this.accel = Number(TxtFormat['Accel']);
			this.brake = Number(TxtFormat['Brake'])/100;
		}else{//通常
			if(TxtFormat['Direction'] == 2){
				this.base.x = 0;
			}else if((TxtFormat['Direction'] == 0 && TxtFormat['ownerReverse'] == 0) || 
			 (TxtFormat['Direction'] == 0 && TxtFormat['ownerReverse'] == 1 && this.Owner == 0) || 
			 (TxtFormat['Direction'] == 1 && TxtFormat['ownerReverse'] == 1 && this.Owner == 1)) {
				//右から
				this.base.x = Number(HcgFormat['CanvasWidth']);
			} else {
				//左から
				this.base.x = -Number(HcgFormat['CanvasWidth']);
			}
		}
		
		if (TxtFormat['Direction'] == 3){
			//カスタムの場合の移動先設定
			if(TxtFormat['targetX'].match(/RND/i)){
				this.target.x = RND(TxtFormat['targetX']);
			}else if(TxtFormat['targetX'].match(/KEEP/i)){
				this.target.x = this.base.x - this.moveX;
			}else{
				this.target.x = Number(TxtFormat['targetX']);
			}
			if(TxtFormat['targetY'].match(/RND/i)){
				this.target.y = RND(TxtFormat['targetY']);
			}else if(TxtFormat['targetY'].match(/KEEP/i)){
				this.target.y = this.base.y - this.base.line - this.moveY;
			}else{
				this.target.y = Number(TxtFormat['targetY']);
			}
			if(TxtFormat['Ang']){
				this.ta = Math.atan2((this.base.y-this.base.line)-this.target.y,this.base.x-this.target.x)/3.1415926535*180;
				if(this.ta > 90 || this.ta < -90)this.ta += 180;
				this.tx.rotation = this.ta;
				this.bg.rotation = this.ta;
			}
			this.target.k = Number(TxtFormat['inK']);
		}else{
			this.target.x = 0;
			this.target.y = 0;
			this.target.k = Number(HcgFormat['MoveSpeed']);
		}

		//文字の左右寄せ
		if(!HcgFormat['VL']){
			if((TxtFormat['txtLine']==1) || (TxtFormat['txtLine']==4&&((this.base.x-this.target.x)>0)) || (TxtFormat['txtLine']==3&&((this.base.x-this.target.x)<0))){
				if(TxtFormat['Align']){
					this.textedgecomment.textAlign = "right";
					this.textcomment.textAlign = "right";
					this.textedgecomment.x = (Number(HcgFormat['SkinWidth']) - this.leftSpace);
					this.textcomment.x = (Number(HcgFormat['SkinWidth']) - this.leftSpace);
					this.handletextedge.x = this.textedgecomment.x - this.textedgewidth;
					this.handletext.x = this.textcomment.x - this.textwidth;
				}else{
					this.textedgecomment.x = (Number(HcgFormat['SkinWidth']) - this.textedgewidth);
					this.textcomment.x = (Number(HcgFormat['SkinWidth']) - this.textwidth);
					this.handletextedge.x = this.textedgecomment.x;
					this.handletext.x = this.textcomment.x;
				}
			}else if((TxtFormat['txtLine']==2)||((TxtFormat['txtLine']==3||TxtFormat['txtLine']==4)&&((this.base.x-this.target.x)==0))){
				if(TxtFormat['Align']){
					this.textedgecomment.textAlign = "center";
					this.textcomment.textAlign = "center";
					this.textedgecomment.x = ((Number(HcgFormat['SkinWidth']) / 2) + this.leftSpace);
					this.textcomment.x = ((Number(HcgFormat['SkinWidth']) / 2) + this.leftSpace);
					this.handletextedge.x = this.textedgecomment.x-(this.textwidth/2);
					this.handletext.x = this.textcomment.x-(this.textwidth/2);
				}else{
					this.textedgecomment.x = ((((Number(HcgFormat['SkinWidth']) - Number(TxtFormat['HandleLimit'])) / 2) - (this.textedgewidth / 2))) + this.leftSpace;
					this.textcomment.x = ((((Number(HcgFormat['SkinWidth']) - Number(TxtFormat['HandleLimit'])) / 2) - (this.textwidth / 2))) + this.leftSpace;
					this.handletextedge.x = this.textedgecomment.x;
					this.handletext.x = this.textcomment.x;
				}
			}else{
				this.handletext.x = this.leftSpace;
				this.handletextedge.x = this.leftSpace;
				this.textedgecomment.x = this.leftSpace;
				this.textcomment.x = this.leftSpace;
			}
		}else{
			if((TxtFormat['txtLine']==1) || (TxtFormat['txtLine']==4&&this.base.x>0) || (TxtFormat['txtLine']==3&&this.base.x<0)){
				if(TxtFormat['Align']){
					this.handletext.textAlign = "right";
					this.handletextedge.textAlign = "right";
					this.handletext.x = Number(TxtFormat['HandleLimit']);
					this.handletextedge.x = Number(TxtFormat['HandleLimit']);
					this.textedgecomment.textAlign = "right";
					this.textcomment.textAlign = "right";
					this.textedgecomment.x = (Number(HcgFormat['CanvasWidth']) - this.leftSpace) + Number(TxtFormat['HandleLimit']);
					this.textcomment.x = (Number(HcgFormat['CanvasWidth']) - this.leftSpace) + Number(TxtFormat['HandleLimit']);
				}else{
					this.handletext.x = this.leftSpace;
					this.handletextedge.x = this.leftSpace;
					this.textedgecomment.x = (Number(HcgFormat['CanvasWidth']) - this.textedgewidth) + Number(TxtFormat['HandleLimit']);
					this.textcomment.x = (Number(HcgFormat['CanvasWidth']) - this.textwidth) + Number(TxtFormat['HandleLimit']);
				}
			}else if((TxtFormat['txtLine']==2)||((TxtFormat['txtLine']==3||TxtFormat['txtLine']==4)&&this.base.x==0)){
				if(TxtFormat['Align']){
					this.handletext.textAlign = "center";
					this.handletextedge.textAlign = "center";
					this.handletext.x = Number(TxtFormat['HandleLimit']) / 2;
					this.handletextedge.x = Number(TxtFormat['HandleLimit']) / 2;
					this.textedgecomment.textAlign = "center";
					this.textcomment.textAlign = "center";
					this.textedgecomment.x = ((Number(HcgFormat['CanvasWidth']) / 2) + this.leftSpace) + Number(TxtFormat['HandleLimit']);
					this.textcomment.x = ((Number(HcgFormat['CanvasWidth']) / 2) + this.leftSpace) + Number(TxtFormat['HandleLimit']);
				}else{
					this.handletext.x = this.leftSpace;
					this.handletextedge.x = this.leftSpace;
					this.textedgecomment.x = ((((Number(HcgFormat['CanvasWidth']) - Number(TxtFormat['HandleLimit'])) / 2) - (this.textedgewidth / 2))) + this.leftSpace + Number(TxtFormat['HandleLimit']);
					this.textcomment.x = ((((Number(HcgFormat['CanvasWidth']) - Number(TxtFormat['HandleLimit'])) / 2) - (this.textwidth / 2))) + this.leftSpace + Number(TxtFormat['HandleLimit']);
				}
			}else{
				this.handletext.x = this.leftSpace;
				this.handletextedge.x = this.leftSpace;
				this.textedgecomment.x = this.leftSpace + Number(TxtFormat['HandleLimit']);
				this.textcomment.x = this.leftSpace + Number(TxtFormat['HandleLimit']);
			}
		}

		//等速移動の初期設定
		if(TxtFormat['MovePattern'] == 1){
			this.target.my=(this.target.y+this.base.line-this.base.y)/(HcgFormat['FrameRate']*0.25)*this.target.k;
			this.target.mx=(this.target.x-this.base.x)/(HcgFormat['FrameRate']*0.25)*this.target.k;
		}else if(TxtFormat['MovePattern'] == 2){
			if(this.base.y != (this.target.y + this.base.line)){
				this.target.by = (this.base.y<(this.target.y + this.base.line))?this.accel*this.target.k:-this.accel*this.target.k;
			}else{
				this.target.by = 0;
			}
			if(this.base.x != this.target.x){
				this.target.bx = (this.base.x<this.target.x)?this.accel*this.target.k:-this.accel*this.target.k;
			}else{
				this.target.bx = 0;
			}
			this.target.my = this.target.by;
			this.target.mx = this.target.bx;
		}
		//コメント表示アニメーション
		CommentAnimation = (function() {
			switch(TxtFormat['MovePattern']){
				case 0:
					this.base.y += (this.target.y+this.base.line+this.moveY-this.base.y) * this.target.k;
					this.base.x += ( this.target.x+this.moveX - this.base.x ) * this.target.k;
					break;
				case 1:
					if(((this.target.my>0) && ((Math.round(this.base.y)+Math.round(this.target.my))<=this.target.y+this.base.line+this.moveY))
					  ||((this.target.my<0) && ((Math.round(this.base.y)+Math.round(this.target.my))>=this.target.y+this.base.line+this.moveY))){
						this.base.y += this.target.my;
					}else{
						this.base.y = this.target.y+this.base.line+this.moveY;
					}
					if(((this.target.mx>0) && ((Math.round(this.base.x)+Math.round(this.target.mx))<=this.target.x+this.moveX))
					  ||((this.target.mx<0) && ((Math.round(this.base.x)+Math.round(this.target.mx))>=this.target.x+this.moveX))){
						this.base.x += this.target.mx;
					}else{
						this.base.x = this.target.x+this.moveX;
					}
					break;
				case 2:
					if((((this.target.by>0) && ((Math.round(this.base.y)+Math.round(this.target.my))<=(this.target.y+this.base.line+this.moveY))))
					  ||(((this.target.by<0) && ((Math.round(this.base.y)+Math.round(this.target.my))>=(this.target.y+this.base.line+this.moveY))))){
						this.base.y += this.target.my;
						this.target.my += this.target.by;
					}else if((this.target.my>=1)||(this.target.my<=-1)){
						this.base.y = this.target.y+this.base.line+this.moveY;
						this.target.my = (this.target.my * -this.brake) + this.target.by;
					}else{
						if(this.base.y!=(this.target.y+this.base.line+this.moveY)){
							this.target.by = (this.base.y<(this.target.y + this.base.line + this.moveY))?this.accel*this.target.k:-this.accel*this.target.k;
							this.target.my = this.target.by;
						}else{
							this.base.y = this.target.y+this.base.line+this.moveY;
							this.target.my = 0;
						}
					}
					if((((this.target.bx>0) && ((Math.round(this.base.x)+Math.round(this.target.mx))<=(this.target.x+this.moveX))))
					  ||(((this.target.bx<0) && ((Math.round(this.base.x)+Math.round(this.target.mx))>=(this.target.x+this.moveX))))){
						this.base.x += this.target.mx;
						this.target.mx += this.target.bx;
					}else if((this.target.mx>=1)||(this.target.mx<=-1)){
						this.base.x = this.target.x+this.moveX;
						this.target.mx = (this.target.mx * -this.brake) + this.target.bx;
					}else{
						if((this.base.x!=(this.target.x+this.moveX))){
							this.target.bx = (this.base.x<this.target.x)?this.accel*this.target.k:-this.accel*this.target.k;
							this.target.mx = this.target.bx;
						}else{
							this.base.x = this.target.x+this.moveX;
							this.target.mx = 0;
						}
					}
					break;
			}
		}).bind(this);

		//1文字ずつ表示させるやーつ
		lockswitch = (function() {
			if(TxtFormat['typeTime']!='0'){
				TypeWrite = (function() {
					if(this.TypeBuf.text.length>TypeCount){
						delete this.textcomment.text;
						this.textcomment.text = this.TypeBuf.text.substring(0,TypeCount+1)+HcgFormat['ComEnd'];
						this.textedgecomment.text = this.textcomment.text;
						if(this.TypeBuf.text.substring(TypeCount,TypeCount+1)=="\n"){
							TypeCount+=((this.TypeBuf.text.substring(TypeCount+1,TypeCount+2)=="\t")?2:1);
							this.textcomment.text = this.TypeBuf.text.substring(0,TypeCount+1)+HcgFormat['ComEnd'];
							TypeLock++;
							this.subwidth =  Number(this.textcomment.getMeasuredWidth());
						}else if(TypeLock<1){
							this.textwidth =  Number(this.textcomment.getMeasuredWidth());
							this.textedgewidth =  Number(this.textedgecomment.getMeasuredWidth());
						}else if(TypeLock>0){
							if(this.textwidth<Number(this.textcomment.getMeasuredWidth())-this.subwidth){
								this.textwidth =  Number(this.textcomment.getMeasuredWidth())-this.subwidth;
								this.textedgewidth =  Number(this.textedgecomment.getMeasuredWidth())-this.subwidth;
							}
						}
						if((TxtFormat['txtLine']==1) || (TxtFormat['txtLine']==4&&((this.base.x-this.target.x)>0)) || (TxtFormat['txtLine']==3&&((this.base.x-this.target.x)<0))){
							if(TxtFormat['Align']){
								this.textedgecomment.textAlign = "right";
								this.textcomment.textAlign = "right";
								this.textedgecomment.x = (Number(HcgFormat['SkinWidth']) - this.leftSpace);
								this.textcomment.x = (Number(HcgFormat['SkinWidth']) - this.leftSpace);
								this.handletextedge.x = this.textedgecomment.x - this.textedgewidth;
								this.handletext.x = this.textcomment.x - this.textwidth;
							}else{
								this.textedgecomment.x = (Number(HcgFormat['SkinWidth']) - this.textedgewidth);
								this.textcomment.x = (Number(HcgFormat['SkinWidth']) - this.textwidth);
								this.handletextedge.x = this.textedgecomment.x;
								this.handletext.x = this.textcomment.x;
							}
						}else if((TxtFormat['txtLine']==2)||((TxtFormat['txtLine']==3||TxtFormat['txtLine']==4)&&((this.base.x-this.target.x)==0))){
							if(TxtFormat['Align']){
								this.textedgecomment.textAlign = "center";
								this.textcomment.textAlign = "center";
								this.textedgecomment.x = ((Number(HcgFormat['SkinWidth']) / 2) + this.leftSpace);
								this.textcomment.x = ((Number(HcgFormat['SkinWidth']) / 2) + this.leftSpace);
								this.handletextedge.x = this.textedgecomment.x-(this.textwidth/2);
								this.handletext.x = this.textcomment.x-(this.textwidth/2);
							}else{
								this.textedgecomment.x = ((((Number(HcgFormat['SkinWidth']) - Number(TxtFormat['HandleLimit'])) / 2) - (this.textedgewidth / 2))) + this.leftSpace;
								this.textcomment.x = ((((Number(HcgFormat['SkinWidth']) - Number(TxtFormat['HandleLimit'])) / 2) - (this.textwidth / 2))) + this.leftSpace;
								this.handletextedge.x = this.textedgecomment.x;
								this.handletext.x = this.textcomment.x;
							}
						}
						TypeCount++;
					}else{
						clearInterval(this.TypeTimer);
					}
				}).bind(this);
				this.TypeTimer = setInterval(TypeWrite, TxtFormat['typeTime']);
			}
		}).bind(this);
		//インアウトアニメーションの切り替え
		animeswitch = (function() {
			delete this.animetimer;
			if(TxtFormat['TimeType'] !=1){
				if(TxtFormat['F_out']){
					this.fout_tick = createjs.Ticker.addEventListener('tick', fade_Out.bind(this));
				}
				if(TxtFormat['Z_out'] > 0){
					this.zout_tick = createjs.Ticker.addEventListener('tick', zoom_Out.bind(this));
				}
			}
			if(TxtFormat['TimeType'] != 1) {
				if (TxtFormat['Direction'] == 3){//カスタム
					//移動先を終点に設定
					if(TxtFormat['outX'].match(/RND/i)){
						this.target.x = RND(TxtFormat['outX']);
					}else if(TxtFormat['outX'].match(/KEEP/i)){
						this.target.x = this.base.x - this.moveX;
					}else if(TxtFormat['outX'].match(/BACK/i)){
						this.target.x = this.target.sx;
					}else{
						this.target.x = Number(TxtFormat['outX']);
					}
					if((TxtFormat['ownerReverse'] == 1) && (this.Owner == 1))
						this.target.x *= -1;
					if(TxtFormat['outY'].match(/RND/i)){
						this.target.y = RND(TxtFormat['outY']);
					}else if(TxtFormat['outY'].match(/KEEP/i)){
						this.target.y = this.base.y - this.base.line - this.moveY;
					}else if(TxtFormat['outY'].match(/BACK/i)){
						this.target.y = this.target.sy;
					}else{
						this.target.y = Number(TxtFormat['outY']);
					}
					this.target.k = Number(TxtFormat['outK']);
				//ここから通常
				}else if(TxtFormat['Direction'] == 2){
				}else if((TxtFormat['Direction'] == 0 && TxtFormat['ownerReverse'] == 0) || 
				 (TxtFormat['Direction'] == 0 && TxtFormat['ownerReverse'] == 1 && this.Owner == 0) ||
				 (TxtFormat['Direction'] == 1 && TxtFormat['ownerReverse'] == 1 && this.Owner == 1)) {
					//右から左へ流れ　右に出る
					this.target.x = Number(HcgFormat['CanvasWidth']);
				} else {
					//左から右へ流れ　左に出る
					this.target.x = -Number(HcgFormat['CanvasWidth']);
				}
				//等速移動用
				if(TxtFormat['MovePattern'] == 1){
					this.target.my=(this.target.y+this.base.line+this.moveY-this.base.y)/(HcgFormat['FrameRate']*0.25)*this.target.k;
					if((TxtFormat['TimeValue'] == 0)&&(TxtFormat['Direction'] == 3)){
						this.target.mx=(this.target.x+this.moveX-(this.base.x+this.textwidth))/(HcgFormat['FrameRate']*0.25)*this.target.k;
					}else{
						this.target.mx=(this.target.x+this.moveX-this.base.x)/(HcgFormat['FrameRate']*0.25)*this.target.k;
					}
				}else if(TxtFormat['MovePattern'] == 2){
					if(this.base.y != (this.target.y + this.base.line)){
						this.target.by = (this.base.y<this.target.y)?this.accel*this.target.k:-this.accel*this.target.k;
					}else{
						this.target.by = 0;
					}
					if(this.base.x != this.target.x){
						this.target.bx = (this.base.x<this.target.x)?this.accel*this.target.k:-this.accel*this.target.k;
					}else{
						this.target.bx = 0;
					}
					this.target.my = this.target.by;
					this.target.mx = this.target.bx;
				}
			}else{
				if(TxtFormat['floated'] != 1){
					createjs.Ticker.removeEventListener('tick', this.anim);
				}
			}
		}).bind(this);

		if(TxtFormat['F_in']){
			this.fin_tick = createjs.Ticker.addEventListener('tick',fade_In.bind(this));
		}
		this.anim = createjs.Ticker.addEventListener('tick', CommentAnimation);
		this.locktimer = setTimeout(lockswitch, (2200*(30/HcgFormat['FrameRate'])*(0.1/Number((TxtFormat['Direction']=='3')?TxtFormat['inK']:HcgFormat['MoveSpeed'])))*((TxtFormat['typeTime']=='0')||(TxtFormat['Direction']!='2')));
		this.animetimer = setTimeout(animeswitch, (TxtFormat['TimeValue'])*1000);
	};

	return new Promise((resolve)=>{
		if(TxtFormat['BgColorType'] != 0) {
			//背景色初期設定
			var BgColor = "";
			if((TxtFormat['userBGColor']==1)&&(this.PrivateColor != "")&&(this.PrivateColor != null)) {
				BgColor = this.PrivateColor;
			} else if((TxtFormat['SiteColor']==1)&&(this.SiteColor != "")&&(this.SiteColor != null)){
				BgColor = this.SiteColor;
			} else if(TxtFormat['BgColorType'] == 2) {
				BgColor = Math.floor(Math.random()*16777215).toString(16);
				BgColor = ("0"+BgColor).slice(-6); //桁合わせ
			} else {
				BgColor = TxtFormat['BgColor'];
			}
			if(TxtFormat['TimeStamp'] == 1){
				this.bgcolorbar = new createjs.Text(timestamp.getHours()+":"+("0"+timestamp.getMinutes()).slice(-2)+":"+("0"+timestamp.getSeconds()).slice(-2), "Italic "+(HcgFormat['SkinHeight']-2)+"px 'Georgia'", "#"+BgColor);
				this.bgcolorbar.outline = true;
				this.bgcolorbar.outline = 2;
				this.bgcolorbar.alpha = 0.5;
				this.bgcolorbar.textAlign = "right";
				this.bgcolorbar.textBaseline = "bottom";
				if(TxtFormat['newLine'] == 4) this.bgcolorbar.y = this.textcomment.lineHeight*(this.longline+1);
				else this.bgcolorbar.y = HcgFormat['SkinHeight']*(this.longline+1);
				this.bgcolorbar.x = this.b_width-2;
			}else{
				var graphics = new createjs.Graphics();
				var color = parseInt(BgColor, 16);
				var skinR = color >> 16 & 0xFF;
				var skinG = color >>  8 & 0xFF;
				var skinB = color & 0xFF;
				this.color_matrix = [
					1.0, 0.0, 0.0, 0.0, skinR/10*8,
					0.0, 1.0, 0.0, 0.0, skinG/10*8,
					0.0, 0.0, 1.0, 0.0, skinB/10*8,
					0.0, 0.0, 0.0, 1.0, 0.0
				];
				//背景設定
				graphics.beginFill("#"+BgColor);
				if(TxtFormat['newLine'] == 4){
					graphics.drawRect(0, 0, this.b_width, Number(TxtFormat['TxtUpSpace'])+((this.textcomment.lineHeight)*(1+this.longline)));
				}else if(TxtFormat['newLine'] == 5){
					graphics.drawRect(0, 0, this.b_width, HcgFormat['SkinHeight']*(1+this.longline));
				}else{
					graphics.drawRect(0, 0, this.b_width, HcgFormat['SkinHeight']);
				}
				this.bgcolorbar = new createjs.Shape(graphics);
			}
		}else{
			this.bgcolorbar = new createjs.Shape();
		}
		//スキン初期設定
		if(TxtFormat['SkinType'] == 0) {
			//スキンなし
			this.skinimage = new createjs.Bitmap();
			this.skinimage.visible = false;
			Main();//表示及び移動のセット
			resolve(this);
		} else if((TxtFormat['SkinType'] != 0)&&(this.PrivateSkin != "")) {
			//リスナー指定スキン
			PrvSkin=((resolve, skinf)=>{
				if(TxtFormat['newLine'] == 5&&this.longline != 0&&skinf){
					this.skinloader = new createjs.ImageLoader(HcgFormat['PathHead']+this.PrivateSkin.slice(0,-4)+"_("+this.longline+")"+this.PrivateSkin.slice(-4), false);
				}else{
					this.skinloader = new createjs.ImageLoader(HcgFormat['PathHead']+this.PrivateSkin, false);
				}
				this.skinloader.addEventListener("complete",(function(event) {
					clearTimeout(errortimer);
					this.image = new createjs.Bitmap(event.result);
					var scalex = (this.image.image.width<(this.b_width*(this.longline+1)))?this.b_width/this.image.image.width:this.longline+1;
					//背景色が透明以外ならカラー調整を加える
					if((TxtFormat['SkinType'] != 0)&&(TxtFormat['TimeStamp'] != 1)&&(TxtFormat['BgColorType'] != 0)) {
						this.bgcolorbar.visible = false;
						this.image.filters = [new createjs.ColorMatrixFilter(this.color_matrix)];
						this.image.cache(0,0,event.result.width,event.result.height);
					}
					this.skinimage = AnimeSet(skinf);//スキンのセット
					if(TxtFormat['Skin_Align'] == '00') {
						this.skinimage.scaleX=scalex;
						if(!skinf){
							this.skinimage.scaleY=this.longline+1;
						}else if(TxtFormat['newLine'] == 4){
							this.skinimage.scaleY=(Number(TxtFormat['TxtUpSpace'])+((this.textcomment.lineHeight)*(1+this.longline)))/HcgFormat['SkinHeight'];
						}
					}
					console.log("指定Skin画像ファイル読み込み");
					Main();//表示及び移動のセット
					resolve(this);
				}).bind(this),false);
				this.skinloader.addEventListener("error",(function(event) {
					clearTimeout(errortimer);
					this.ImgRemove();
					if(TxtFormat['newLine'] == 5&&this.longline != 0&&skinf){
						skinf = false;
						console.log("改行数に対応した指定スキンが見つかりません");
						PrvSkin(resolve, false);
					}else{
						this.skinimage = new createjs.Bitmap();
						this.skinimage.visible = false;
						console.log("そげな名前のスキンねーゔぇ");
						Main();//表示及び移動のセット
						resolve(this);
					}
				}).bind(this),false);
				this.skinloader.load();
				var errortimer = setTimeout((function(){this.skinloader.dispatchEvent(new createjs.Event("error"));}).bind(this), 100);
			}).bind(this);
			PrvSkin(resolve, true);
		} else if(TxtFormat['SkinType'] == 1) {
			//通常スキン
			if(TxtFormat['SkinFile'] != "") {
				FixSkin=((resolve, skinf)=>{
					if(TxtFormat['newLine'] == 5&&this.longline != 0&&skinf){
						this.skinloader = new createjs.ImageLoader(HcgFormat['PathHead']+TxtFormat['SkinFile'].slice(0,-4)+"_("+this.longline+")"+TxtFormat['SkinFile'].slice(-4), false);
					}else{
						this.skinloader = new createjs.ImageLoader(HcgFormat['PathHead']+TxtFormat['SkinFile'], false);
					}
					this.skinloader.addEventListener("complete",(function(event) {
						clearTimeout(errortimer);
						this.image = new createjs.Bitmap(event.result);
						var scalex = (this.image.image.width<(this.b_width*(this.longline+1)))?this.b_width/this.image.image.width:this.longline+1;
						//背景色が透明以外ならカラー調整を加える
						if((TxtFormat['SkinType'] != 0)&&(TxtFormat['TimeStamp'] != 1)&&(TxtFormat['BgColorType'] != 0)) {
							this.bgcolorbar.visible = false;
							this.image.filters = [new createjs.ColorMatrixFilter(this.color_matrix)];
							this.image.cache(0,0,event.result.width,event.result.height);
						}
						this.skinimage = AnimeSet(skinf);//スキンのセット
						if(TxtFormat['Skin_Align'] == '00') {
							this.skinimage.scaleX=scalex;
							if(!skinf){
								this.skinimage.scaleY=this.longline+1;
							}else if(TxtFormat['newLine'] == 4){
								this.skinimage.scaleY=(Number(TxtFormat['TxtUpSpace'])+((this.textcomment.lineHeight)*(1+this.longline)))/HcgFormat['SkinHeight'];
							}
						}
						Main();//表示及び移動のセット
						resolve(this);
					}).bind(this),false);
					this.skinloader.addEventListener("error",(function(event) {
						clearTimeout(errortimer);
						this.ImgRemove();
						if(TxtFormat['newLine'] == 5&&this.longline != 0&&skinf){
							skinf = false;
							console.log("改行数に対応した固定スキンが見つかりません");
							FixSkin(resolve, false);
						}else{
							this.skinimage = new createjs.Bitmap();
							this.skinimage.visible = false;
							console.log("スキンがないお");
							Main();//表示及び移動のセット
							resolve(this);
						}
					}).bind(this),false);
					this.skinloader.load();
					var errortimer = setTimeout((function(){this.skinloader.dispatchEvent(new createjs.Event("error"));}).bind(this), 100);
				}).bind(this);
				FixSkin(resolve, true);
			}
		} else if(TxtFormat['SkinType'] == 2) {
			//ランダムスキン
			handleComplete = (function(event) {
				var loader = event.target;
				loader.removeEventListener("complete", handleComplete);
				var xml = loader.getResult("IDSkinsFile");
				if(xml.getElementsByTagName('skin').length > 0) {
					var filename = xml.getElementsByTagName('skin')[
					Math.floor(Math.random() * xml.getElementsByTagName('skin').length)
					].firstChild.nodeValue;
					console.log(filename);
					RandomSkin=((resolve, skinf)=>{
						if(TxtFormat['newLine'] == 5&&this.longline != 0&&skinf){
							this.skinloader = new createjs.ImageLoader(HcgFormat['PathHead']+filename.slice(0,-4)+"_("+this.longline+")"+filename.slice(-4), false);
						}else{
							this.skinloader = new createjs.ImageLoader(HcgFormat['PathHead']+filename, false);
						}
						this.skinloader.addEventListener("complete",(function(event) {
							clearTimeout(errortimer);
							this.image = new createjs.Bitmap(event.result);
							var scalex = (this.image.image.width<(this.b_width*(this.longline+1)))?this.b_width/this.image.image.width:this.longline+1;
							//背景色が透明以外ならカラー調整を加える
							if((TxtFormat['SkinType'] != 0)&&(TxtFormat['TimeStamp'] != 1)&&(TxtFormat['BgColorType'] != 0)) {
								this.bgcolorbar.visible = false;
								this.image.filters = [new createjs.ColorMatrixFilter(this.color_matrix)];
								this.image.cache(0,0,event.result.width,event.result.height);
							}
							this.skinimage = AnimeSet(skinf);//スキンのセット
							if(TxtFormat['Skin_Align'] == '00') {
								this.skinimage.scaleX=scalex;
								if(!skinf){
									this.skinimage.scaleY=this.longline+1;
								}else if(TxtFormat['newLine'] == 4){
									this.skinimage.scaleY=(Number(TxtFormat['TxtUpSpace'])+((this.textcomment.lineHeight)*(1+this.longline)))/HcgFormat['SkinHeight'];
								}
							}
							Main();//表示及び移動のセット
							resolve(this);
						}).bind(this),false);
						this.skinloader.addEventListener("error",(function(event) {
							clearTimeout(errortimer);
							this.ImgRemove();
							if(TxtFormat['newLine'] == 5&&this.longline != 0&&skinf){
								skinf = false;
								console.log("改行数に対応したランダムスキンが見つかりません");
								RandomSkin(resolve, false);
							}else{
								this.skinimage = new createjs.Bitmap();
								this.skinimage.visible = false;
								console.log("skin.xmlがおかしいのか読み込めぬ");
								Main();//表示及び移動のセット
								resolve(this);
							}
						}).bind(this),false);
						this.skinloader.load();
						var errortimer = setTimeout((function(){this.skinloader.dispatchEvent(new createjs.Event("error"));}).bind(this), 100);
					}).bind(this);
					RandomSkin(resolve, true);
				}else{
					this.skinimage = new createjs.Bitmap();
					this.skinimage.visible = false;
					console.log("Skinsファイルが空です、設定ツールでSkinフォルダを設定してください");
					Main();//表示及び移動のセット
					resolve(this);
				}
				console.log("Skinsファイル読み込み");
			}).bind(this);
			//ランダムスキンが入ったフォルダ
			if(TxtFormat['SkinFolder'] != "") {
				var queue = new createjs.LoadQueue(true);
				queue.loadFile({"src":HcgFormat['CurrentPath']+"skins.xml","id":"IDSkinsFile"});
				queue.addEventListener('complete',handleComplete);
			}else{
				this.skinimage = new createjs.Bitmap();
				this.skinimage.visible = false;
				console.log("Skinフォルダ未設定");
				Main();//表示及び移動のセット
				resolve(this);
			}
		}
		//スキンファイルを処理する部分
		AnimeSet = ((skinf)=>{
			var builder = new createjs.SpriteSheetBuilder();
			builder.padding=0;
			var container = new createjs.Container();
			container.addChild(this.image);
			container.image=this.image;
			var frames=new Array();
			var count=0;
			//フレーム取り込み
			if(this.image.image.height>(Number(HcgFormat['SkinHeight'])*(1+(skinf*this.longline*(TxtFormat['newLine']==5))))){
				for(var y=0;((y+1)*Number(HcgFormat['SkinHeight'])*(1+(skinf*this.longline*(TxtFormat['newLine']==5))))<=this.image.image.height;y++){
					frames.push(builder.addFrame(container,new createjs.Rectangle(0,0,Number((HcgFormat['SkinWidth']=="FIX")?this.image.image.width:HcgFormat['SkinWidth']),(Number(HcgFormat['SkinHeight'])*(1+(skinf*this.longline*(TxtFormat['newLine']==5))))),1,((function(target,rec){
						target.image.y=-rec*(Number(HcgFormat['SkinHeight'])*(1+(skinf*this.longline*(TxtFormat['newLine']==5))));
					}).bind(this)),[y]));
				}
			}else{
				frames.push(builder.addFrame(container,new createjs.Rectangle(0,0,Number((HcgFormat['SkinWidth']=="FIX")?this.image.image.width:HcgFormat['SkinWidth']),this.image.image.height),1));
			}
			delete this.image;
			container.removeChild(this.image);
			delete container;
			//アニメーション生成
			builder.addAnimation("stamp",frames,"stamp",Number(HcgFormat['AnimeSpeed']));
			return new createjs.Sprite(builder.build(),"stamp");
		});
	});
};
//カスタム用ランダム処理
function RND(rnd){
	var tmp;
	var ret;
	if(ret = rnd.match(/RND\((.+)\:(.+)\)/i)){
		if(tmp = ret[1].match(/(-?\d+),(-?\d+)/))
			ret[1]=(Number(tmp[2])-Number(tmp[1]))*Math.random()+Number(tmp[1]);
		if(tmp = ret[2].match(/(-?\d+),(-?\d+)/))
			ret[2]=(Number(tmp[2])-Number(tmp[1]))*Math.random()+Number(tmp[1]);
		return Number(Math.round( Math.random())?ret[1]:ret[2]);
	}else{
		if(tmp = rnd.match(/(-?\d+),(-?\d+)/))
			rnd=(Number(tmp[2])-Number(tmp[1]))*Math.random()+Number(tmp[1]);
		return Number(rnd);
	}
};
//移動用のベース作成
CommentGenerator.prototype.getBase = function() {
	this.plate = new createjs.Container();
	this.plate.addChild(this.base);
	return this.plate;
};
//各データ出力
CommentGenerator.prototype.getLongline = function() {
	return this.longline;
};
CommentGenerator.prototype.getBline = function() {
	return this.base.line;
};
//削除タイマー関連
CommentGenerator.prototype.getTimer = function() {
	return this.timer;
};
CommentGenerator.prototype.setTimer = function(tim) {
	this.timer = tim;
};
//アニメーション開始
CommentGenerator.prototype.Play = function() {
	if(this.skinimage instanceof createjs.Sprite){
		this.skinimage.play();
	}
};
//アニメーション停止
CommentGenerator.prototype.stopper = function() {
	createjs.Ticker.removeEventListener('tick', this.anim);
	createjs.Ticker.removeEventListener('tick', this.fin_tick);
	createjs.Ticker.removeEventListener('tick', this.fout_tick);
	createjs.Ticker.removeEventListener('tick', this.zin_tick);
	createjs.Ticker.removeEventListener('tick', this.zout_tick);
	clearTimeout(this.locktimer);
	clearTimeout(this.animetimer);
	if(this.TypeTimer){
		clearInterval(this.TypeTimer);
	}
}
//キャンバス除去
CommentGenerator.prototype.Remove = function(){
	this.bg.removeChild(this.skinimage);
	this.bg.removeChild(this.bgcolorbar);
	this.tx.removeChild(this.textedgecomment);
	this.tx.removeChild(this.textcomment);
	this.tx.removeChild(this.handletextedge);
	this.tx.removeChild(this.handletext);
	this.base.removeChild(this.bg);
	this.base.removeChild(this.tx);	
	this.plate.removeChild(this.base);
	if(this.skinloader){
		this.ImgRemove();
	}
	return this.plate;
};
//画像除去
CommentGenerator.prototype.ImgRemove = function(){
	this.skinloader.removeAllEventListeners();
	this.skinloader.destroy();
	delete this.skinloader;
}
//移動距離の追加
CommentGenerator.prototype.MoveAdd = function(movX,movY,TxtFormat){
	if(typeof(movX) == "string"){
		if(movX.match(/RND/i)){
			this.moveX += RND(movX);
		}else{
			this.moveX += Number(movX);
		}
	}else{
		this.moveX += movX;
	}
	if(typeof(movY) == "string"){
		if(movY.match(/RND/i)){
			this.moveY += RND(movY);
		}else{
			this.moveY += Number(movY);
		}
	}else{
		this.moveY += movY;
	}
	if(TxtFormat['floated'] == 1){
		this.target.my+=movY/(createjs.Ticker.framerate*0.25)*this.target.k;
		this.target.mx+=movX/(createjs.Ticker.framerate*0.25)*this.target.k;
	}
};
//追加で移動
CommentGenerator.prototype.PlateMove = function(movX,movY){
	if(typeof(movX) == "string"){
		if(movX.match(/RND/i)){
			this.plate.x += RND(movX);
		}else{
			this.plate.x += Number(movX);
		}
	}else{
		this.plate.x += movX;
	}
	if(typeof(movY) == "string"){
		if(movY.match(/RND/i)){
			this.plate.y += RND(movY);
		}else{
			this.plate.y += Number(movY);
		}
	}else{
		this.plate.y += movY;
	}
};
//アルファ減衰
CommentGenerator.prototype.SubAlpha = function(mi){
	this.base.alpha -= mi;
	this.target.alpha -= mi;
}

function SiteSet(site){
	this.value = (site.firstChild.nodeValue.match(/^\n[\s\0]+$/)?"":site.firstChild.nodeValue);
	if(site.getAttributeNode("Color"))
		this.color = site.getAttributeNode("Color").value;
	if(site.getAttributeNode("Skin"))
		this.skin = site.getAttributeNode("Skin").value;
}


///////////////////////////////////////////////////////////////////////////////
// hcg_LimeChat.js ～ HTML5コメジェネ・LimeChat連携スクリプト
///////////////////////////////////////////////////////////////////////////////
////////////////////
//■導入方法
// 1.当ファイルをLimeChatのscriptsフォルダに配置する
//   例）C:\【LimeChatインストール先】\users\【アカウント名】\scripts
//
// 2.LimeChat側でスクリプトを有効にする
//   ・LimeChatのメニューから「設定→スクリプトの設定」を開く。
//   ・スクリプトの設定画面で、「hcg_LimeChat.js」の行を右クリックし、○を付ける。
//   ・スクリプトの設定画面の閉じるボタンを押す。
//
////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////
//■設定

//comment.xmlのパス
//パス区切り「\」は「\\」と二個けてかいてください
//例：C:\\Users\\user\\Desktop\\CommentGenerator\\comment.xml

var xmlpath = "C:\\hoge\\comment.xml";

////////////////////////////////////////////////////////////////////////////////////////////////////

function talkChat(prefix, text) {
	// DOMオブジェクト生成
	var dom = new ActiveXObject("Msxml2.DOMDocument");
	// 同期化
	dom.async = false;
	dom.load(xmlpath);

	// 結果判定
	if (dom.parseError.errorCode == 0) {
		// ルート取得
    	var root = dom.documentElement;
    	//commentElement作成
    	var comment = dom.createElement("comment");
    	var date = new Date();
    	var unixTimestamp = Math.round(date.getTime() / 1000);
    	comment.setAttribute("no", "0");
    	comment.setAttribute("time", unixTimestamp);
    	comment.setAttribute("handle", prefix.nick);
    	comment.setAttribute("service", "twitch");
    	comment.text = text;
    	root.appendChild(comment);
    	dom.save(xmlpath);
	} else {
		log("コメジェネxml parseError");
	}
}

///////////////////////////////////////////////////////////////////////////////

function event::onLoad() {
    oShell = new ActiveXObject("Wscript.Shell");
    oWmi   = GetObject("winmgmts:\\\\.\\root\\cimv2");
    objFso = new ActiveXObject("Scripting.FileSystemObject");
}

function event::onUnLoad() {
    oShell = null;
    oWmi   = null;
    objFso = null;
}

function event::onChannelText(prefix, channel, text) {
	if( prefix.nick != "jtv") talkChat(prefix, text);
}

function event::onChannelNotice(prefix, channel, text) {
	talkChat(prefix, text);
}

function event::onChannelAction(prefix, channel, text) {
	talkChat(prefix, text);
}

function event::onTalkText(prefix, targetNick, text) {
    if( prefix.nick != "jtv") talkChat(prefix, text);
}

function event::onTalkNotice(prefix, targetNick, text) {
	talkChat(prefix, text);
}

function event::onTalkAction(prefix, targetNick, text) {
	talkChat(prefix, text);
}
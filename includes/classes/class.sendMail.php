<?php

/**
 * Class to check up e-mail
 *
 * @author Konstantin Granin <kostya@granin.me>
 * @copyright Copyright (c) 2010, Konstantin Granin
 */
class verifyEmail {

    /**
     * User name
     * @var string
     */
    private $_fromName;

    /**
     * Domain name
     * @var string
     */
    private $_fromDomain;

    /**
     * SMTP port number
     * @var int
     */
    private $_port;

    /**
     * The connection timeout, in seconds.
     * @var int
     */
    private $_maxConnectionTimeout;

    /**
     * The timeout on socket connection
     * @var int
     */
    private $_maxStreamTimeout;

    public function __construct() {
        $this->_fromName = 'noreply';
        $this->_fromDomain = 'localhost';
        $this->_port = 25;
        $this->_maxConnectionTimeout = 30;
        $this->_maxStreamTimeout = 5;
    }

    /**
     * Set email address for SMTP request
     * @param string $email Email address
     */
    public function setEmailFrom($email) {
        list($this->_fromName, $this->_fromDomain) = $this->_parseEmail($email);
    }

    /**
     * Set connection timeout, in seconds.
     * @param int $seconds
     */
    public function setConnectionTimeout($seconds) {
        $this->_maxConnectionTimeout = $seconds;
    }

    /**
     * Set the timeout on socket connection
     * @param int $seconds
     */
    public function setStreamTimeout($seconds) {
        $this->_maxStreamTimeout = $seconds;
    }

    /**
     * Validate email address.
     * @param string $email
     * @return boolean  True if valid.
     */
    public function isValid($email) {
        return (false !== filter_var($email, FILTER_VALIDATE_EMAIL));
    }

    /**
     * Get array of MX records for host. Sort by weight information.
     * @param string $hostname The Internet host name.
     * @return array Array of the MX records found.
     */
    public function getMXrecords($hostname) {
        $mxhosts = array();
        $mxweights = array();
        if (getmxrr($hostname, $mxhosts, $mxweights)) {
            array_multisort($mxweights, $mxhosts);
        }
        /**
         * Add A-record as last chance (e.g. if no MX record is there).
         * Thanks Nicht Lieb.
         */
        $mxhosts[] = $hostname;
        return $mxhosts;
    }

    /**
     * check up e-mail
     * @param string $email Email address
     * @return boolean True if the valid email also exist
     */
    public function check($email) {
        $result = false;
        if ($this->isValid($email)) {
            list($user, $domain) = $this->_parseEmail($email);
            $mxs = $this->getMXrecords($domain);
            $fp = false;
            $timeout = ceil($this->_maxConnectionTimeout / count($mxs));
            foreach ($mxs as $host) {
//                if ($fp = @fsockopen($host, $this->_port, $errno, $errstr, $timeout)) {
                if ($fp = @stream_socket_client("tcp://" . $host . ":" . $this->_port, $errno, $errstr, $timeout)) {
                    stream_set_timeout($fp, $this->_maxStreamTimeout);
                    stream_set_blocking($fp, 1);
//                    stream_set_blocking($fp, 0);
                    $code = $this->_fsockGetResponseCode($fp);
                    if ($code == '220') {
                        break;
                    } else {
                        fclose($fp);
                        $fp = false;
                    }
                }
            }
            if ($fp) {
                $this->_fsockquery($fp, "HELO " . $this->_fromDomain);
                //$this->_fsockquery($fp, "VRFY " . $email);
                $this->_fsockquery($fp, "MAIL FROM: <" . $this->_fromName . '@' . $this->_fromDomain . ">");
                $code = $this->_fsockquery($fp, "RCPT TO: <" . $user . '@' . $domain . ">");
                $this->_fsockquery($fp, "RSET");
                $this->_fsockquery($fp, "QUIT");
                fclose($fp);
                if ($code == '250') {
                    /**
                     * http://www.ietf.org/rfc/rfc0821.txt
                     * 250 Requested mail action okay, completed
                     * email address was accepted
                     */
                    $result = true;
                } elseif ($code == '450' || $code == '451' || $code == '452') {
                    /**
                     * http://www.ietf.org/rfc/rfc0821.txt
                     * 450 Requested action not taken: the remote mail server
                     *     does not want to accept mail from your server for
                     *     some reason (IP address, blacklisting, etc..)
                     *     Thanks Nicht Lieb.
                     * 451 Requested action aborted: local error in processing
                     * 452 Requested action not taken: insufficient system storage
                     * email address was greylisted (or some temporary error occured on the MTA)
                     * i believe that e-mail exists
                     */
                    $result = true;
                }
            }
        }
        return $result;
    }

    /**
     * Parses input string to array(0=>user, 1=>domain)
     * @param string $email
     * @return array
     * @access private
     */
    private function _parseEmail(&$email) {
        return sscanf($email, "%[^@]@%s");
    }

    /**
     * writes the contents of string to the file stream pointed to by handle $fp
     * @access private
     * @param resource $fp
     * @param string $string The string that is to be written
     * @return string Returns a string of up to length - 1 bytes read from the file pointed to by handle.
     * If an error occurs, returns FALSE.
     */
    private function _fsockquery(&$fp, $query) {
        stream_socket_sendto($fp, $query . "\r\n");
        return $this->_fsockGetResponseCode($fp);
    }

    /**
     * Reads all the line long the answer and analyze it.
     * @access private
     * @param resource $fp
     * @return string Response code
     * If an error occurs, returns FALSE
     */
    private function _fsockGetResponseCode(&$fp) {
	$reply = stream_get_line($fp, 1);
	$status = stream_get_meta_data($fp);
	if ($status['unread_bytes']>0)
	{
		$reply .= stream_get_line($fp, $status['unread_bytes'],"\r\n");
	}

        preg_match('/^(?<code>[0-9]{3}) (.*)$/ims', $reply, $matches);
        $code = isset($matches['code']) ? $matches['code'] : false;
        return $code;
    }

}

class Mailer {

	protected $verifyEmail;
	protected $smtp = array(
		"status" => false,
		"host" => "smtp.gmail.com",
		"secure" => "ssl",
		"port" => 465,
		"username" => "",
		"password" => "",
		"from" => "",
		"from_name" => ""
	);
	protected $options = array(
		"autoVerify" => false,
		"verifyEmailFrom" => "",
		"verifyConnectionTimeout" => 5,
		"verifyStreamTimeout" => 5,
		"limit" => 100 // gửi tối đa đến 100 mail cùng lúc
	);

	function __construct($options = array()){
		global $_config, $_path;

		if(isset($options['autoVerify']))
			$this->options['autoVerify'] = $options['autoVerify'];

		if(isset($options['verifyEmailFrom']))
			$this->options['verifyEmailFrom'] = $options['verifyEmailFrom'];

		if(isset($options['verifyConnectionTimeout']))
			$this->options['verifyConnectionTimeout'] = $options['verifyConnectionTimeout'];

		if(isset($options['verifyStreamTimeout']))
			$this->options['verifyStreamTimeout'] = $options['verifyStreamTimeout'];

		if(isset($options['limit']))
			$this->options['limit'] = $options['limit'];


		if(isset($_config['mailer'])){

			if(isset($_config['mailer']['smtp']))
				$this->smtp['status'] = $_config['mailer']['smtp'];

			if(isset($_config['mailer']['host']))
				$this->smtp['host'] = $_config['mailer']['host'];

			if(isset($_config['mailer']['secure']))
				$this->smtp['secure'] = $_config['mailer']['secure'];

			if(isset($_config['mailer']['port']))
				$this->smtp['port'] = $_config['mailer']['port'];

			if(isset($_config['mailer']['username']))
				$this->smtp['username'] = $_config['mailer']['username'];

			if(isset($_config['mailer']['password']))
				$this->smtp['password'] = $_config['mailer']['password'];

			if(isset($_config['mailer']['from']))
				$this->smtp['from'] = $_config['mailer']['from'];

			if(isset($_config['mailer']['from_name']))
				$this->smtp['from_name'] = $_config['mailer']['from_name'];		
		}


		if(!class_exists('Swift_Mailer'))
			require_once $_path. '/vendor/SwiftMailer/swift_required.php';

	}

	function setAccount($username = "", $password = ""){

		if($username)
			$this->smtp['username'] = $username;

		if($password)
			$this->smtp['password'] = $password;

	}

	function setFrom($from = "", $from_name = ""){

		if($from)
			$this->smtp['from'] = $from;

		if($from_name)
			$this->smtp['from_name'] = $from_name;

	}

	function check($mail = ""){

		if(!filter_var($mail, FILTER_VALIDATE_EMAIL))
			return false;

		if($this->options['verifyEmailFrom'])
			$this->verifyEmail->setEmailFrom($this->options['verifyEmailFrom']);

		if($this->options['verifyConnectionTimeout'])
			$this->verifyEmail->setConnectionTimeout($this->options['verifyConnectionTimeout']);

		if($this->options['verifyStreamTimeout'])
			$this->verifyEmail->setStreamTimeout($this->options['verifyStreamTimeout']);


        if ($this->verifyEmail->check($mail))
            return true;

        return false;

	}

	function send($to = "", $subject = "", $body = "", $type = "text/html"){

		if(empty($to) || empty($this->smtp['from']) )
			return false;

		if($this->smtp['status'] == false){

            $headers  = "From: ".$this->smtp['from_name']." <".$this->smtp['from'].">\r\nReply-To: ".$this->smtp['from_name']." <".$this->smtp['from'].">\n";
            $headers .= "MIME-Version: 1.0" . "\r\n";
            $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";

            if(mail(is_array($to) ? implode(",", $to) : $to, $subject, $body, $headers, '-f'.$this->smtp['from']))
                return true;
            else
                return false;

		} else {

			if(empty($this->smtp['host']) || empty($this->smtp['username']) || empty($this->smtp['password']))
				return false;

			if($this->options['autoVerify'] == true){

				if(is_array($to)){
					$i = 0;
					foreach ($to as $mail){
						if(!$this->check($mail))
							unset($to[$i]);
						$i++;		
					}
				} else 
					if(!$this->check($to))
						return false;

			}

			if(!is_array($to))
				$to = array($to);

			try {

				$transport = (new Swift_SmtpTransport($this->smtp['host'], $this->smtp['port'], $this->smtp['secure']))
	  				->setUsername($this->smtp['username'])
	  				->setPassword($this->smtp['password']);

	  			$mailer = new Swift_Mailer($transport);
	  			$mailer->registerPlugin(new Swift_Plugins_AntiFloodPlugin($this->options['limit']));

				$message = new Swift_Message($subject);

				$message->setFrom([$this->smtp['from'] => $this->smtp['from_name']]);

				if(array_search($this->smtp['from'], $to)){
					$message->setTo($this->smtp['from']);
					unset($to[array_search($this->smtp['from'], $to)]);
				}

				if($to)
					$message->setBcc($to);

				$message->setBody($body, $type);

                if ($mailer->send($message))
                    return true;
                else
                    return false;

        	} catch(Swift_TransportException $e){
        		print_r($e->getMessage());
        		return false;
        	}

        	return false;
		}

	}


	function template($body = "", $options = ""){
		global $_path, $_config;

		$default_options = json_decode('{
			"pre-header": "",
			"plugin-class": "",
			"background": "#ffffff",
			"contentbackground": "#ffffff",
			"contentpaddingleft": "0",
			"contentpaddingright": "0",
			"headerborderbottom": "1px solid #e5e5e5",
			"headertext": "'.$_config['site_name'].'",
			"headerfont": "Trebuchet, sans-serif",
			"headeralign": "left",
			"headerfontsize": "21",
			"headerbold": "bold",
			"headeritalic": 0,
			"headertexttransform": "none",
			"headerbackground": "#222222",
			"headercolor": "#f09900",
			"headerpaddingtop": "5",
			"headerpaddingright": 20,
			"headerpaddingbottom": 5,
			"headerpaddingleft": 20,
			"header_spacer": 10,
			"headerimg_placement": "just_text",
			"headerimg": "",
			"headerimg_width": "600",
			"headerimg_height": "1",
			"headerimg_alt": "",
			"headerimg_align": "",
			"headlinefont": "Trebuchet, sans-serif",
			"headlinealign": "left",
			"headlinefontsize": "19",
			"headlinebold": 0,
			"headlineitalic": 0,
			"headlinetexttransform": "none",
			"headlinecolor": "#343434",
			"subheadlinefont": "Trebuchet, sans-serif",
			"subheadlinealign": "left",
			"subheadlinefontsize": "18",
			"subheadlinebold": 0,
			"subheadlineitalic": 0,
			"subheadlinetexttransform": "none",
			"subheadlinecolor": "#343434",
			"textfont": "Helvetica, Arial, sans-serif",
			"textalign": "left",
			"textfontsize": 14,
			"textbold": 0,
			"textitalic": 0,
			"textcolor": "#525252",
			"linkcolor": "#fbb72a",
			"linkbold": 0,
			"linkitalic": 0,
			"linktexttransform": "none",
			"linkunderline": 1,
			"footer": "<p>Copyright © 2014 - '.date('Y').' '.$_config['site_name'].' All rights reserved.<br>Powered By Inuha</p>",
			"footerbackground": "#ffffff",
			"footerbordertop": "1px solid #f3f3f3",
			"footerpaddingtop": "10",
			"footerpaddingright": 0,
			"footerpaddingbottom": 10,
			"footerpaddingleft": 0,
			"headertexttranform": "none",
			"headlinetexttranform": "none",
			"subheadlinetexttranform": "none",
			"linktexttranform": "none"
		}',true);

		if(is_array($options) && $options){
			foreach ($options as $key => $value) {
				if(array_key_exists($key, $default_options))
					$default_options[$key] = $value;
			}
		}



		$template = file_exists($_path.'/template/mailer.html') ? file_get_contents($_path.'/template/mailer.html') : '';

		$template = preg_replace_callback("/###(.*?)###/si",
			function($var) use ($default_options){
				return isset($default_options[$var[1]]) ? $default_options[$var[1]] : '';
			},
			$template);

		$template = str_replace("{#mailcontent#}", $body, $template);
		return $template;

	}

}






?>
<script lang="ts" setup>
  import { ref, onMounted, nextTick, reactive } from 'vue';
  import { useRouter } from 'vue-router';
  import { useI18n } from 'vue-i18n';
  import { loginApi, LoginSessionApi, UpdateUserApi } from '../api/userApi';
  import { useUserStore } from '../store/user'
  import { md5 } from 'js-md5';
  import { Base64 } from 'js-base64';
  import { ElMessage } from 'element-plus';
  import $ from 'jquery';
  const { t } = useI18n();
  const form = ref({
    username: '',
    password: '',
    checked: false,
    lang: 'en',
    // realm: '',
    // nonce: '',
    // nonceKey: '',
    // digestAlgorithm: []
  })
  const editform = ref({
    strUser: "",
    strPasswd: "",
    strUserType: "",
    Newpassword: "",
    Newpassword1: ""
  })
  const reg8 = ref<boolean>(false)
  const reg10 = ref<boolean>(false)
  const langArr = [
    {
      label: 'English',
      value: 'en'
    },
    // {
    //   label: '简体中文',
    //   value: 'zhchs'
    // }
  ]
  const pwdDialog = ref<boolean>(false);
  const router = useRouter();
  const useStore = useUserStore()

  // const getNonceData = async () => {
  //   const res = await GetNonce()
  //   if (res.status == 200 && res.data.code == 'HPRO_CODE_OK') {
  //     const result = res.data.result;
  //     form.value.digestAlgorithm = result.digestAlgorithm;
  //     form.value.nonce = result.nonce;
  //     form.value.nonceKey = result.nonceKey;
  //     form.value.realm = result.realm;
  //   }
  // }

  const login = async () => {
    // await getNonceData();
    // const str = form.value.realm + ':' + form.value.password + ':' + form.value.nonce
    // const formatPwd = md5(str)
    const formatPwd = md5(form.value.password)
    const params = {
      username: form.value.username,
      password: formatPwd,
      // digestAlgorithm: form.value.digestAlgorithm[0],
      // nonceKey: form.value.nonceKey
    }
    const res = await loginApi(params)
    // console.log('login =>', res)
    if (res.status === 200 && res.data.code === 0) {
      const result = res.data.result
      if (result.access_token) {
        useStore.setUsername(form.value.username);
        useStore.setAccess_token(result.access_token)
        sessionStorage.setItem('Access_token', result.access_token)
      }

      if (result.weak_password) {
        // console.log('密码为弱密码，需要重新修改')
        pwdDialog.value = true;
        nextTick(() => {
          $('.strPasswd').hide()
          $('.rulechildren').css('background', 'grey')
          $('.ruletext').css('color', 'grey')
        })
      } else {
        const res1 = await LoginSessionApi();
        if (res1.status == 200 && res1.data.code === 0) {
          sessionStorage.setItem('session', res1.data.result.session);
          useStore.setSession(res1.data.result.session)
        }
        ElMessage({
          message: 'Login success',
          type: 'success'
        })
        if (form.value.checked) {
          let random = randomWord(11)
          let encryption = random + Base64.encode(form.value.password);
          // console.log('editform =>', editform.value)
          const user = {
            username: form.value.username,
            password: encryption,
            checked: form.value.checked
          };
          localStorage.setItem('user', JSON.stringify(user))
        } else {
          localStorage.setItem('user', JSON.stringify({}))
        }
        router.push({
          path: '/Monitoring'
        })
      }
    } else {
       ElMessage({
        message: 'Login failed.',
        type: 'error'
      })
    }
  }


  // 监听重复密码和新密码是否一致
  const update = () => {
    var reg1 = new RegExp(/(?=.*[A-Z])/);
    var reg2 = new RegExp(/(?=.*[a-z])/);
    var reg3 = new RegExp(/(?=.*[0-9])/);
    var reg4 = new RegExp(/(?=(?:.*?[!@#$%*()_+^&}{:;?.]){1})/);
    var reg5 = new RegExp(/((?:0(?=1)|1(?=2)|2(?=3)|3(?=4)|4(?=5)|5(?=6)|6(?=7)|7(?=8)|8(?=9)|9(?=0)){1,2}\d)/);
    var reg6 = new RegExp(/((?:9(?=8)|8(?=7)|7(?=6)|6(?=5)|5(?=4)|4(?=3)|3(?=2)|2(?=1)|1(?=0)){1,2}\d)/);
    var reg7 = RegExp(form.value.username, "g");
    var reg9 = form.value.password;
    $('.strPasswd4').hide();
    $('.strPasswd5').hide();
    if (editform.value.Newpassword.length >= 8) {
      $('.rule1').css('background', "#80C269");
      $('.ruletext1').css('color', "#80C269");
    } else {
      $('.rule1').css('background', "red");
      $('.ruletext1').css('color', "red");
    }
    if (reg1.test(editform.value.Newpassword)) {
      $('.rule2').css('background', "#80C269");
      $('.ruletext2').css('color', "#80C269");
    } else {
      $('.rule2').css('background', "red");
      $('.ruletext2').css('color', "red");
    }
    if (reg2.test(editform.value.Newpassword)) {
      $('.rule3').css('background', "#80C269");
      $('.ruletext3').css('color', "#80C269");
    } else {
      $('.rule3').css('background', "red");
      $('.ruletext3').css('color', "red");
    }
    if (reg3.test(editform.value.Newpassword)) {
      $('.rule4').css('background', "#80C269");
      $('.ruletext4').css('color', "#80C269");
    } else {
      $('.rule4').css('background', "red");
      $('.ruletext4').css('color', "red");
    }
    if (reg4.test(editform.value.Newpassword)) {
      $('.rule5').css('background', "#80C269");
      $('.ruletext5').css('color', "#80C269");
    } else {
      $('.rule5').css('background', "red");
      $('.ruletext5').css('color', "red");
    }
    if (editform.value.Newpassword.length >= 2) {
      if (reg5.test(editform.value.Newpassword) || reg6.test(editform.value.Newpassword)) {
        $('.rule6').css('background', "red");
        $('.ruletext6').css('color', "red");
      } else {
        $('.rule6').css('background', "#80C269");
        $('.ruletext6').css('color', "#80C269");
      }
    } else if (editform.value.Newpassword.length == 1) {
      $('.rule6').css('background', "#80C269");
      $('.ruletext6').css('color', "#80C269");
    }
    if (editform.value.Newpassword) {
      if (reg7.exec(editform.value.Newpassword) == null) {
        $('.rule7').css('background', "#80C269");
        $('.ruletext7').css('color', "#80C269");
        reg8.value = true;
      } else {
        $('.rule7').css('background', "red");
        $('.ruletext7').css('color', "red");
        reg8.value = false;
      }
    }
    if (reg9 !== editform.value.Newpassword) {
      $('.rule8').css('background', "#80C269");
      $('.ruletext8').css('color', "#80C269");
      reg10.value = true;
    } else {
      $('.rule8').css('background', "red");
      $('.ruletext8').css('color', "red");
      reg10.value = false;
    }
    if (editform.value.Newpassword == "") {
      $('.rulechildren').css('background', 'grey')
      $('.ruletext').css('color', 'grey')
      nextTick(() => {
        $(".strPasswd3").hide();
      })
    } else {
      if (editform.value.Newpassword.length < 8 || !reg1.test(editform.value.Newpassword) || !reg2.test(editform.value.Newpassword) || !reg3.test(editform.value.Newpassword) || !reg4.test(editform.value.Newpassword) || reg5.test(editform.value.Newpassword) || reg6.test(editform.value.Newpassword) || reg8.value == false || reg10.value == false) {
        nextTick(() => {
          $('.strPasswd1').hide();
          $('.strPasswd2').show();
          $('.strPasswd3').show()
        })
      } else {
        nextTick(() => {
          $('.strPasswd1').show();
          $('.strPasswd2').hide();
          $('.strPasswd3').hide();
        })
      }
    }
    if (editform.value.Newpassword1) {
      if (editform.value.Newpassword !== editform.value.Newpassword1) {
        nextTick(() => {
          $('.strPasswd6').hide()
          $('.strPasswd7').show();
        })
      } else {
        nextTick(() => {
          $('.strPasswd7').hide()
          $('.strPasswd6').show();
        })
      }
    }
  }

  // 监听新密码输入框的值
  const confirmpassword = () => {
    if (editform.value.Newpassword !== editform.value.Newpassword1) {
      nextTick(() => {
        $('.strPasswd6').hide()
        $('.strPasswd7').show();
      })
    } else {
      nextTick(() => {
        $('.strPasswd7').hide()
        $('.strPasswd6').show();
      })
    }
  }

  const onSubmit = async () => {
    const oldPwd = form.value.password;
    if (oldPwd !== editform.value.strPasswd) {
      $('.oldstrPasswd').show();
      $('.strPasswd0').hide();
      return;
    } else {
      $('.oldstrPasswd').hide();
      $('.strPasswd0').show();
    }
    var reg1 = new RegExp(/(?=.*[A-Z])/);
    var reg2 = new RegExp(/(?=.*[a-z])/);
    var reg3 = new RegExp(/(?=.*[0-9])/);
    var reg4 = new RegExp(/(?=(?:.*?[!@#$%*()_+^&}{:;?.]){1})/);
    var reg5 = new RegExp(/((?:0(?=1)|1(?=2)|2(?=3)|3(?=4)|4(?=5)|5(?=6)|6(?=7)|7(?=8)|8(?=9)|9(?=0)){1,2}\d)/);
    var reg6 = new RegExp(/((?:9(?=8)|8(?=7)|7(?=6)|6(?=5)|5(?=4)|4(?=3)|3(?=2)|2(?=1)|1(?=0)){1,2}\d)/);
    const editForm = editform.value;
    if (editForm.Newpassword.length < 8 || !reg1.test(editForm.Newpassword) || !reg2.test(editForm.Newpassword) || !reg3.test(editForm.Newpassword) || !reg4.test(editForm.Newpassword) || reg5.test(editForm.Newpassword) || reg6.test(editForm.Newpassword) || reg8.value == false || reg10.value == false) {
      return;
    }
    if (editForm.Newpassword !== editForm.Newpassword1) return;
    var params = {
      username: form.value.username,
      oldPassword: md5(editForm.strPasswd),
      newPassword: md5(editForm.Newpassword)
    }
    const res = await UpdateUserApi(params);
    console.log(res)
    if (res.status === 200 && res.data.code == 0) {
      ElMessage({
        message: t('Login.login_again_modify_success'),
        type: 'success'
      })
      pwdDialog.value = false;
      editform.value.strPasswd = '';
      editform.value.Newpassword = '';
      editform.value.Newpassword1 = '';
    }
  }

  const cancel = () => {
    pwdDialog.value = false;
    editform.value.strPasswd = '';
    editform.value.Newpassword = '';
    editform.value.Newpassword1 = '';
  }

  onMounted(() => {
    let user = localStorage.getItem('user')
    
    if (user) {
      try {
        const userData: any = JSON.parse(user);
        form.value.username = userData.username;
        let pwd = userData.password.slice(11);
        form.value.password = Base64.decode(pwd);
        form.value.checked = userData.checked;
      } catch (error) {
        console.error('解析用户数据失败:', error);
        // 清理无效数据
        localStorage.removeItem('user');
      }
    }
  })

  const randomWord = (num:number) => {
    var str = "",
      arr = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
    let pos;
    for (var i = 0; i < num; i++) {
      pos = Math.round(Math.random() * (arr.length - 1));
      str += arr[pos];
    }
    return str;
  }
  
</script>

<template>
  <div class="login-view">
    <div class="login-center">
      <div class="login_title"></div>
      <div class="login-card">
        <div class="prompt" id="prompt"></div>
        <div class="prompt" id="prompt1"></div>
        <el-input v-model="form.username" placeholder="Username">
          <template #prefix>
            <i class="iconfont icon-yonghu1"></i>
          </template>
        </el-input>
        <el-input v-model="form.password" type="password" placeholder="Password" show-password>
          <template #prefix>
            <i class="iconfont icon-suo"></i>
          </template>
        </el-input>
        <div class="language">{{ t('Login.login_lang') }}</div>
        <el-select v-model="form.lang" >
          <el-option
            v-for="(item, index) in langArr"
            :key="index"
            :label="item.label"
            :value="item.value"
          ></el-option>
        </el-select>
        <el-checkbox v-model="form.checked" label="Remember password" style="margin-top: 10px;"></el-checkbox>
        <div class="login-btn"><el-button type="primary" @click="login">Login</el-button></div>
      </div>
    </div>
    <el-dialog v-model="pwdDialog" :title="t('Login.login_change_pwd')" width="40%">
        <el-form class="el_form" label-position="right" label-width="135px" :model="editform">
          <el-form-item :label="t('Login.login_old_pwd')" style="word-break: normal;">
            <el-input type="password" v-model="editform.strPasswd" show-password></el-input>
            <span class="strPasswd strPasswd0"><i class="iconfont icon-duihao right"></i></span>
            <span class="strPasswd oldstrPasswd error"><i class="iconfont icon-guanbi"></i>{{ t('Login.login_old_pwd_err') }}</span>
          </el-form-item>
          <el-form-item :label="t('Login.login_new_pwd')" style="word-break: normal;">
            <el-input type="password" v-model="editform.Newpassword" show-password @input="update"></el-input>
            <span class="strPasswd strPasswd1"><i class="iconfont icon-duihao right"></i></span>
            <span class="strPasswd strPasswd2"><i class="iconfont icon-guanbi error"></i></span>
            <span class="strPasswd strPasswd3">{{ t('Setting.set_pw_security_low') }}</span>
            <span class="strPasswd strPasswd4">{{ t('Setting.set_pw_new_cannot_old') }}</span>
            <span class="strPasswd strPasswd5">{{ t('Setting.set_pw_new_cannot_empty') }}</span>
          </el-form-item>
          <div class="updateHelp">{{ t('Setting.set_pw_title') + ':' }}</div>
          <ul class="rule">
            <li><span class="rulechildren rule1"></span><span class="ruletext ruletext1">{{ t('Setting.set_pw_length') }}</span></li>
            <li><span class="rulechildren rule2"></span><span class="ruletext ruletext2">{{ t('Setting.set_pw_uppercase') }}</span></li>
            <li><span class="rulechildren rule3"></span><span class="ruletext ruletext3">{{ t('Setting.set_pw_lowercase') }}</span></li>
            <li><span class="rulechildren rule4"></span><span class="ruletext ruletext4">{{ t('Setting.set_pw_number') }}</span></li>
            <li><span class="rulechildren rule5"></span><span class="ruletext ruletext5">{{ decodeURIComponent(t('Setting.set_pw_special_character')) }}</span></li>
            <li><span class="rulechildren rule6"></span><span class="ruletext ruletext6">{{ t('Setting.set_pw_lnc_dec') }}</span></li>
            <li><span class="rulechildren rule7"></span><span class="ruletext ruletext7">{{ t('Setting.set_pw_user') }}</span></li>
            <li><span class="rulechildren rule8"></span><span class="ruletext ruletext8">{{ t('Setting.set_not_default_pw') }}</span></li>
          </ul>
          <el-form-item :label="t('Setting.set_confirm_password')" style="word-break: normal;">
            <el-input type="password" v-model="editform.Newpassword1" show-password @input="confirmpassword"></el-input>
            <span class="strPasswd strPasswd6"><i class="iconfont icon-duihao right"></i></span>
            <span class="strPasswd strPasswd7 error"><i class="iconfont icon-guanbi"></i>{{ t('Setting.set_two_passwords_error') }}</span>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="onSubmit">{{ t('CommTableEdit.comm_ok') }}</el-button>
            <el-button @click="cancel">{{ t('CommTableEdit.comm_cancel') }}</el-button>
          </el-form-item>
        </el-form>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.login-view {
  width: 100vw;
  height: 100vh;
  background-image: url('../assets/imgs/login-background.jpg');
  background-size: 100% 100%;
  position: relative;
  .login-center {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    .login_title {
      width: 863px;
      height: 85px;
      background: url(../assets/imgs/HProAINVR-en.png) no-repeat center center;
    }
    .login-card {
      width: 464px;
      height: 370px;
      background-color: #fff;
      margin-top: 20px;
      padding: 40px 74px;
      border-radius: 4px;
      .el-input {
        margin-top: 20px;
        // font-size: 16px;
        border-bottom: 2px solid #D6D8D7;
        :deep(.el-input__wrapper) {
          box-shadow: none;
          background-color: #fff;
        }
        :deep(.el-input__inner) {
          color: #222;
        }
        .iconfont {
          color: #666666;
          font-size: 18px;
          margin-right: 20px;
          margin-left: 10px;
        }
      }
      .language {
        font-size: 12px;
        margin-top: 10px;
        color: #000;
      }
      .el-select {
        margin-top: 10px;
        border-bottom: 2px solid #D6D8D7;
        :deep(.el-select__wrapper) {
          box-shadow: none;
          border: none;
          .el-select__placeholder {
            color: #000;
          }
        }
      }
      :deep(.el-checkbox__input) {
        background-color: transparent;
        // border: 1px solid #0399FE;
        .el-checkbox__inner {
          background-color: transparent;
        }
      }
      :deep(.is-checked) {
        .el-checkbox__inner {
          background-color: #0399FE;
        }
      }
      
      .login-btn {
        width: 100%;
        margin-top: 10px;
        .el-button {
          width: 100%;
          background-color: #0399FE;
          border: none;
          color: #fff;
        }
      }
    }
  }
  .el_form {
    width: 100%;
    .el-form-item {
      color: #000 !important;
      .el-input {
        width: 300px !important;
      }
      .iconfont {
        margin: 0 10px;
      }
      .right {
        color: #80C269;
      }
      .error {
        color: #EB3700;
      }
      .strPasswd4, .strPasswd5 {
        color: #EB3700;
      }
    }
    .updateHelp {
      margin-left: 17.5%;
      margin-top: 10px;
    }
    .rule {
      list-style: none;
      margin-left: 17.5%;
      margin-top: 1%;
      margin-bottom: 10px;
      li {
        .rulechildren {
          width: 10px;
          height: 10px;
          border-radius: 5px;
          background-color: grey;
          display: inline-block;
          margin-right: 10px;
        }
      }
    }
  }
  
}
</style>
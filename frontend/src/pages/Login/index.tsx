import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Tabs, Form, Input, Button, message, Space, ConfigProvider, theme } from 'antd';
import styled from 'styled-components';
import { setCredentials, logout } from '@/store/slices/authSlice';
import { api } from '@/services/api';
import { UserOutlined, MailOutlined, LockOutlined } from '@ant-design/icons';
import './index.css';
import { RootState } from '@/store';

const LoginContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-image: url('../../../imgs/background.png');
  background-size: cover;
  background-position: center;
  color: #ffffff;
`;

const LoginCard = styled.div`
  width: 100%;
  max-width: 400px;
  padding: 32px;
  background: transparent;
  border-radius: 8px;
`;

const Title = styled.h1`
  text-align: center;
  margin-bottom: 32px;
  font-weight: 400;
`;

const StyledTabs = styled(Tabs)`
  .ant-tabs-nav {
    margin-bottom: 24px;
  }
  
  .ant-tabs-tab {
    color: rgba(255, 255, 255, 0.65);
    font-size: 16px;
    
    &.ant-tabs-tab-active .ant-tabs-tab-btn {
      color: #ffffff;
    }
  }
  
  .ant-tabs-ink-bar {
    background-color: #ffffff;
  }
`;

const VerifyButton = styled(Button)`
  color: #000000 !important;
  background-color: #ffffff !important;
  border: none;
  height: 40px;
`;

const LoginButton = styled(Button)`
  color: #000000 !important;
  background-color: #ffffff !important;
  border: none;
  height: 40px;
`;

const Agreement = styled.div`
  margin-top: 16px;
  text-align: center;
  color: #F9FBFC;
  font-size: 14px;
  
  a {
    color: #C9FF85;
    text-decoration: none;
  }
`;

const StyledFormItem = styled(Form.Item)`
  margin-bottom: 30px;
`;

const Login: React.FC = ({ setTokenVerified }) => {
  const [phoneForm] = Form.useForm();
  const [emailForm] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const [loading, setLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [activeTab, setActiveTab] = useState('phone');

  // 检查登录状态
  useEffect(() => {
    const checkTokenValidity = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          // 验证token是否有效
          const response = await api.get('/auth/verify-token');
          
          if (response.status === 200) {
            setTokenVerified(true);
            // 获取来源页面信息
            const searchParams = new URLSearchParams(location.search);
            const from = searchParams.get('from');
            
            if (from) {
              try {
                // 尝试解析来源URL
                const fromUrl = new URL(from);
                // 如果是外部网站，直接跳转回去
                if (fromUrl.origin !== window.location.origin) {
                  window.location.href = from;
                  return;
                }
              } catch (e) {
                console.error('解析来源URL失败:', e);
              }
            }
            
            // 如果是内部页面或解析失败，使用默认值
            const redirectUrl = from || location.state?.from || '/text-chat';
            navigate(redirectUrl);
          }
        } catch (error) {
          console.error('Token验证失败:', error);
          // 清除无效的token
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          dispatch(logout());
        }
      }
    };
    
    checkTokenValidity();
  }, []);

  // 重置表单
  const resetForm = () => {
    if (activeTab === 'phone') {
      phoneForm.resetFields();
    } else {
      emailForm.resetFields();
    }
  };

  // 切换标签页时重置表单
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    resetForm();
  };

  const handleSendCode = async () => {
    try {
      const currentForm = activeTab === 'phone' ? phoneForm : emailForm;
      const values = await currentForm.validateFields([activeTab]);
      const contact = values[activeTab];
      const type = activeTab;

      setLoading(true);
      const response = await api.post('/auth/send-code', {
        [type]: contact,
      });

      if (response.data.message === '验证码已发送') {
        message.success('验证码已发送，请注意查收');
        setCountdown(60);
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '发送验证码失败');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (values: any) => {
    try {
      setLoginLoading(true);
      console.log('开始登录流程');
      console.log('当前激活的标签页:', activeTab);
      console.log('表单值:', values);

      // 验证表单
      const currentForm = activeTab === 'phone' ? phoneForm : emailForm;
      await currentForm.validateFields();
      console.log('表单验证通过');

      const loginData = {
        [activeTab]: values[activeTab],
        code: values.code,
      };
      console.log('发送登录请求:', loginData);

      const response = await api.post(`/auth/login/${activeTab}`, loginData);
      console.log('登录响应:', response.data);

      const { token, user } = response.data;
      
      // 确保 token 保存到 localStorage
      if (token) {
        localStorage.setItem('token', token);
        console.log('Token 已保存到 localStorage:', token.substring(0, 10) + '...');
      } else {
        console.error('登录响应中没有 token');
        message.error('登录失败：未获取到认证信息');
        return;
      }
      
      // 设置 Redux store
      dispatch(setCredentials({ token, user }));
      console.log('Redux store 已更新');
      
      message.success('登录成功');
      
      // 获取来源页面信息
      const searchParams = new URLSearchParams(location.search);
      const from = searchParams.get('from');
      console.log('来源页面:', from);
      const userInfo = activeTab === 'phone' ? values.phone : values.email;
      
      if (from) {
        try {
          // 尝试解析来源URL
          const fromUrl = new URL(from);
          // 如果是外部网站，直接跳转回去
          if (fromUrl.origin !== window.location.origin) {
            window.location.href = from + `?contact=${userInfo}`;
            return;
          }
        } catch (e) {
          console.error('解析来源URL失败:', e);
        }
      }
      
      // 如果是内部页面或解析失败，使用默认值
      const redirectUrl = from || location.state?.from || '/text-chat';
      
      // 构建新的URL，添加用户信息参数
      const newUrl = new URL(redirectUrl, window.location.origin);
      newUrl.searchParams.set('contact', userInfo);
      
      // 使用 setTimeout 确保状态更新后再跳转
      setTimeout(() => {
        navigate(newUrl.pathname + newUrl.search);
      }, 100);
    } catch (error: any) {
      console.error('登录错误:', error);
      if (error.errorFields) {
        // 表单验证错误
        const firstError = error.errorFields[0];
        message.error(firstError.errors[0]);
      } else if (error.response) {
        // API 错误
        message.error(error.response.data?.message || '登录失败');
      } else {
        // 其他错误
        message.error('登录失败，请稍后重试');
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const items = [
    {
      key: 'phone',
      label: '手机登录',
      children: (
        <Form 
          form={phoneForm} 
          onFinish={handleLogin} 
          layout="vertical"
          initialValues={{ phone: '', code: '' }}
          validateTrigger={['onChange', 'onBlur']}
        >
          <StyledFormItem
            name="phone"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="请输入手机号码"
              size="large"
            />
          </StyledFormItem>
          <StyledFormItem>
            <Space.Compact style={{ width: '100%' }}>
              <Form.Item
                name="code"
                noStyle
                rules={[
                  { required: true, message: '请输入验证码' },
                  { len: 6, message: '验证码长度必须为6位' },
                ]}
              >
                <Input
                  prefix={<LockOutlined />}
                  placeholder="请输入验证码"
                  size="large"
                  style={{ width: 'calc(100% - 120px)' }}
                />
              </Form.Item>
              <VerifyButton
                type="primary"
                onClick={handleSendCode}
                disabled={countdown > 0 || loading}
                size="large"
                style={{ width: '120px' }}
              >
                {countdown > 0 ? `${countdown}秒后重试` : '获取验证码'}
              </VerifyButton>
            </Space.Compact>
          </StyledFormItem>
          <StyledFormItem>
            <LoginButton type="primary" htmlType="submit" loading={loginLoading} block>
              立即登录
            </LoginButton>
          </StyledFormItem>
        </Form>
      ),
    },
    {
      key: 'email',
      label: '邮箱登录',
      children: (
        <Form 
          form={emailForm} 
          onFinish={handleLogin} 
          layout="vertical"
          initialValues={{ email: '', code: '' }}
          validateTrigger={['onChange', 'onBlur']}
        >
          <StyledFormItem
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入正确的邮箱格式' },
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="请输入邮箱"
              size="large"
            />
          </StyledFormItem>
          <StyledFormItem>
            <Space.Compact style={{ width: '100%' }}>
              <Form.Item
                name="code"
                noStyle
                rules={[
                  { required: true, message: '请输入验证码' },
                  { len: 6, message: '验证码长度必须为6位' },
                ]}
              >
                <Input
                  prefix={<LockOutlined />}
                  placeholder="请输入验证码"
                  size="large"
                  style={{ width: 'calc(100% - 120px)' }}
                />
              </Form.Item>
              <VerifyButton
                type="primary"
                onClick={handleSendCode}
                disabled={countdown > 0 || loading}
                size="large"
                style={{ width: '120px' }}
              >
                {countdown > 0 ? `${countdown}秒后重试` : '获取验证码'}
              </VerifyButton>
            </Space.Compact>
          </StyledFormItem>
          <StyledFormItem>
            <LoginButton type="primary" htmlType="submit" loading={loginLoading} block>
              立即登录
            </LoginButton>
          </StyledFormItem>
        </Form>
      ),
    },
  ];

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
      }}
    >
      <LoginContainer>
        <LoginCard>
          <Title>欢迎登录/注册</Title>
          <StyledTabs 
            items={items} 
            onChange={handleTabChange}
          />
          <Agreement>
            登录即代表同意
            <a href="#" onClick={(e) => { e.preventDefault(); message.info('用户协议'); }}>《用户协议》</a>
            和
            <a href="#" onClick={(e) => { e.preventDefault(); message.info('隐私政策'); }}>《隐私政策》</a>
          </Agreement>
        </LoginCard>
      </LoginContainer>
    </ConfigProvider>
  );
};

export default Login; 
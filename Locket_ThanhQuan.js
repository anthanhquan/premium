/***********************************************
 *  Premium Unlock Script - Locket & RevenueCat
 *  🛠️ By Thành Quân
 *  📌 Version: V1.0.2 (Clean & Optimized)
 ***********************************************/

// =================== [PHẦN 1] - XÓA HEADER =================== //
// Mục đích: xóa header "X-RevenueCat-ETag" để tránh bị phát hiện

function setHeaderValue(headers, key, value) {
  const lowerKey = key.toLowerCase();
  if (lowerKey in headers) {
    headers[lowerKey] = value;
  } else {
    headers[key] = value;
  }
}

// Nếu script được gọi khi gửi request
if (typeof $request !== "undefined") {
  let modifiedHeaders = $request.headers;
  setHeaderValue(modifiedHeaders, "X-RevenueCat-ETag", "");
  $done({ headers: modifiedHeaders });
}

// =================== [PHẦN 2] - SỬA RESPONSE =================== //
// Mục đích: giả lập thuê bao Premium / Gold để mở khóa app

if (typeof $response !== "undefined") {
  // Lấy User-Agent từ request để xác định ứng dụng
  const ua = $request.headers["User-Agent"] || $request.headers["user-agent"];

  // Parse body JSON từ phản hồi gốc của RevenueCat
  let obj = JSON.parse($response.body);

  // Thêm thông điệp cá nhân (không ảnh hưởng đến app)
  obj.Attention = "🎉 Chúc mừng bạn! Script by Thành Quân.";

  // Đối tượng thuê bao giả (subscription info)
  const subscriptionInfo = {
    is_sandbox: false,
    ownership_type: "PURCHASED",             // ✅ Đã mua
    billing_issues_detected_at: null,
    period_type: "normal",                   // Gói thuê bao thường
    expires_date: "2099-12-18T01:04:17Z",   // 🔥 Hết hạn xa trong tương lai
    grace_period_expires_date: null,
    unsubscribe_detected_at: null,
    original_purchase_date: "2024-07-28T01:04:18Z",
    purchase_date: "2024-07-28T01:04:17Z",
    store: "app_store"                       // Mua từ App Store
  };

  // Đối tượng entitlement (quyền truy cập)
  const entitlementInfo = {
    grace_period_expires_date: null,
    purchase_date: "2024-07-28T01:04:17Z",
    product_identifier: "com.thanhquan.premium.yearly",  // ✅ đổi tên sạch
    expires_date: "2099-12-18T01:04:17Z"
  };

  // Bảng ánh xạ: xác định entitlement theo ứng dụng (User-Agent)
  const mapping = {
    "%E8%BD%A6%E7%A5%A8%E7%A5%A8": ["vip+watch_vip"], // App Trung Quốc
    "Locket": ["Gold"]                               // App Locket
  };

  // Kiểm tra ứng dụng hiện tại bằng cách so khớp chuỗi trong User-Agent
  const matchedApp = Object.keys(mapping).find(key => ua.includes(key));

  if (matchedApp) {
    // Nếu có khớp trong bảng ánh xạ
    const [entitlementName, productID] = mapping[matchedApp];

    if (productID) {
      // Gán gói thuê bao theo product ID được ánh xạ
      entitlementInfo.product_identifier = productID;
      obj.subscriber.subscriptions[productID] = subscriptionInfo;
    } else {
      // Nếu không có product ID cụ thể, dùng mặc định
      obj.subscriber.subscriptions["com.thanhquan.premium.yearly"] = subscriptionInfo;
    }

    // Gán entitlement (quyền sử dụng tính năng cao cấp)
    obj.subscriber.entitlements[entitlementName] = entitlementInfo;

  } else {
    // Nếu không khớp app nào → dùng giá trị mặc định là "pro"
    obj.subscriber.subscriptions["com.thanhquan.premium.yearly"] = subscriptionInfo;
    obj.subscriber.entitlements["pro"] = entitlementInfo;
  }

  // Trả về phản hồi đã chỉnh sửa cho ứng dụng
  $done({ body: JSON.stringify(obj) });
}

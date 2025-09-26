/***********************************************
 *  Premium Unlock Script - Locket & RevenueCat
 *  🛠️ By ThanhQuan | Build: V1.0.2 (2025-09-26)
 ***********************************************/

// =================== [PHẦN 1] - XÓA HEADER =================== //
// 👉 Mục đích: xóa header "X-RevenueCat-ETag" để tránh bị phát hiện cache

function setHeaderValue(headers, key, value) {
  const lowerKey = key.toLowerCase();
  if (lowerKey in headers) {
    headers[lowerKey] = value;
  } else {
    headers[key] = value;
  }
}

// Nếu script chạy khi gửi request
if (typeof $request !== "undefined") {
  let modifiedHeaders = $request.headers;
  setHeaderValue(modifiedHeaders, "X-RevenueCat-ETag", "");
  $done({ headers: modifiedHeaders });
}

// =================== [PHẦN 2] - SỬA RESPONSE =================== //
// 👉 Mục đích: giả lập thuê bao Premium / Gold để mở khóa ứng dụng

if (typeof $response !== "undefined") {
  // Lấy User-Agent để xác định ứng dụng gọi API RevenueCat
  const ua = $request.headers["User-Agent"] || $request.headers["user-agent"];

  // Parse body JSON từ phản hồi gốc của RevenueCat
  let obj = JSON.parse($response.body);

  // Thêm thông điệp cá nhân (không ảnh hưởng đến logic)
  obj.Attention = "🎉 Script unlock Premium by ThanhQuan – Không chia sẻ công khai!";

  // =================== THUÊ BAO GIẢ =================== //
  const thanhquanSubscription = {
    is_sandbox: false,                       // Không phải môi trường test
    ownership_type: "PURCHASED",             // ✅ Đã mua gói
    billing_issues_detected_at: null,
    period_type: "normal",                   // Gói thuê bao chuẩn
    expires_date: "2099-12-18T01:04:17Z",   // ⏰ Hết hạn rất xa (2099)
    grace_period_expires_date: null,
    unsubscribe_detected_at: null,
    original_purchase_date: "2025-09-26T01:04:18Z", // 📅 Ngày mua ban đầu (mới nhất)
    purchase_date: "2025-09-26T01:04:17Z",          // 📅 Ngày mua (mới nhất)
    store: "app_store"                      // Nguồn mua: App Store
  };

  // =================== ENTITLEMENT GIẢ =================== //
  const thanhquanEntitlement = {
    grace_period_expires_date: null,
    purchase_date: "2025-09-26T01:04:17Z",           // 📅 Ngày mua
    product_identifier: "com.ohoang7.premium.yearly", // ⚠️ GIỮ NGUYÊN để đảm bảo tương thích
    expires_date: "2099-12-18T01:04:17Z"
  };

  // =================== ÁNH XẠ ỨNG DỤNG =================== //
  const mapping = {
    "%E8%BD%A6%E7%A5%A8%E7%A5%A8": ["vip+watch_vip"], // App Trung Quốc
    "Locket": ["Gold"]                                // App Locket
  };

  // Kiểm tra xem User-Agent có chứa chuỗi ứng dụng nào không
  const matchedApp = Object.keys(mapping).find(key => ua.includes(key));

  if (matchedApp) {
    // Nếu trùng khớp → ánh xạ entitlement tương ứng
    const [entitlementName, productID] = mapping[matchedApp];

    if (productID) {
      thanhquanEntitlement.product_identifier = productID;
      obj.subscriber.subscriptions[productID] = thanhquanSubscription;
    } else {
      obj.subscriber.subscriptions["com.ohoang7.premium.yearly"] = thanhquanSubscription;
    }

    // Gán quyền truy cập Premium cho app
    obj.subscriber.entitlements[entitlementName] = thanhquanEntitlement;

  } else {
    // Nếu không khớp ứng dụng nào → dùng mặc định là "pro"
    obj.subscriber.subscriptions["com.ohoang7.premium.yearly"] = thanhquanSubscription;
    obj.subscriber.entitlements["pro"] = thanhquanEntitlement;
  }

  // Trả lại JSON đã chỉnh sửa cho ứng dụng
  $done({ body: JSON.stringify(obj) });
}
